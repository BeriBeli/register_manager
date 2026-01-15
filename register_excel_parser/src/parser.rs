use crate::error::Error;
use polars::prelude::*;

pub fn parse_register(df: DataFrame) -> anyhow::Result<DataFrame, Error> {
    let parsed_df = df
        .lazy()
        // fullfill empty description
        .with_column(
            when(col("DESCRIPTION").is_null())
                .then(lit("No Description"))
                .otherwise(col("DESCRIPTION"))
                .alias("DESCRIPTION"),
        )
        // Unmerge cells and distribute content to each cell
        .select([col("*").fill_null_with_strategy(FillNullStrategy::Forward(None))])
        .with_columns(&[
            // caculate reg width by sum field width
            // "32"
            col("WIDTH")
                .cast(DataType::UInt32)
                .sum()
                .over(&[col("ADDR")])
                .cast(DataType::String)
                .alias("REG_WIDTH"),
            // reg width (bytes)
            (col("WIDTH")
                .cast(DataType::UInt32)
                .sum()
                .over(&[col("ADDR")])
                / lit(8))
            .alias("BYTES"),
            // reg's base name to parse "reg{n}, n=0~3"
            coalesce(&[col("REG")
                .first()
                .over(&[col("ADDR")])
                .str()
                .extract(lit(r"(.*?)\{n\}"), 1)])
            .alias("BASE_REG"),
            // if need explode "reg{n}, n=0~3" to reg_0, reg_1, reg_2, reg_3
            col("REG")
                .first()
                .over(&[col("ADDR")])
                .str()
                .contains(lit(r"\{n\}"), false)
                .alias("IS_EXPANDABLE"),
            col("REG")
                .first()
                .over(&[col("ADDR")])
                .str()
                .extract(lit(r"n\s*=\s*range\(([^)]+)\)"), 1)
                .str()
                .split(lit(","))
                .list()
                .eval(col("").str().strip_chars(lit(" \t")).cast(DataType::UInt32))
                .alias("ARGS"),
            // convert reg's offset to decimal
            col("ADDR")
                .first()
                .over(&[col("ADDR")])
                .str()
                .extract(lit("0x([0-9a-fA-F]+)"), 1)
                .str()
                .to_integer(lit(16), Some(DataType::UInt32), false)
                .alias("BASE_ADDR"),
            // get field's bit offset
            col("BIT")
                .over(&[col("ADDR")])
                .str()
                .extract(lit(r"(?:\d+:)?(\d+)"), 1)
                .alias("BIT_OFFSET"),
        ])
        .with_column(
            when(col("ARGS").list().len().eq(lit(3)))
                .then(int_ranges(
                    col("ARGS").list().get(lit(0), true).cast(DataType::UInt32),
                    col("ARGS").list().get(lit(1), true).cast(DataType::UInt32),
                    col("ARGS").list().get(lit(2), true).cast(DataType::UInt32),
                    DataType::UInt32,
                ))
                .otherwise(
                    when(col("ARGS").list().len().eq(lit(2)))
                        .then(int_ranges(
                            col("ARGS").list().get(lit(0), true).cast(DataType::UInt32),
                            col("ARGS").list().get(lit(1), true).cast(DataType::UInt32),
                            lit(1),
                            DataType::UInt32,
                        ))
                        .otherwise(
                            when(col("ARGS").list().len().eq(lit(1)))
                                .then(int_ranges(
                                    lit(0),
                                    col("ARGS").list().get(lit(0), true).cast(DataType::UInt32),
                                    lit(1),
                                    DataType::UInt32,
                                ))
                                .otherwise(lit(Null {})),
                        ),
                )
                .alias("N_SERIES"),
        )
        .explode(by_name(["N_SERIES"], true))
        .filter(
            col("IS_EXPANDABLE")
                .and(col("N_SERIES").is_not_null())
                .or(col("IS_EXPANDABLE")
                    .not()
                    .and(col("FIELD").is_not_null())
                    .and(col("FIELD").neq(lit("")))),
        )
        .with_columns(&[
            when(col("IS_EXPANDABLE"))
                .then(
                    (col("BASE_ADDR").cast(DataType::UInt32)
                        + col("N_SERIES").cast(DataType::UInt32)
                            * col("BYTES").cast(DataType::UInt32))
                    .map(
                        |s| {
                            let ca = s.u32()?;
                            let new_ca: StringChunked = ca
                                .into_iter()
                                .map(|opt_x| opt_x.map(|x| format!("0x{:X}", x)))
                                .collect();
                            Ok(Some(new_ca.into_column()))
                        },
                        GetOutput::from_type(DataType::String),
                    ),
                )
                .otherwise(col("ADDR"))
                .alias("ADDR"),
            when(col("IS_EXPANDABLE"))
                .then(
                    col("BASE_REG").cast(DataType::String)
                        + lit("_")
                        + (col("N_SERIES")
                            .rank(
                                RankOptions {
                                    method: RankMethod::Dense,
                                    descending: false,
                                },
                                None,
                            )
                            .over([col("BASE_REG")])
                            - lit(1))
                        .cast(DataType::String),
                )
                .otherwise(col("REG"))
                .alias("REG"),
        ])
        .lazy()
        .group_by_stable(["REG"])
        .agg([
            col("ADDR").first(),
            col("REG_WIDTH").first(),
            col("FIELD"),
            // col("BIT"),
            col("WIDTH"),
            col("ATTRIBUTE"),
            // col("BYTES"),
            col("BIT_OFFSET"),
            col("DEFAULT"),
            col("DESCRIPTION"),
            // col("BASE_REG"),
            // col("IS_EXPANDABLE"),
            // col("BASE_ADDR"),
            col("N_SERIES"),
        ])
        .collect()?;

    Ok(parsed_df)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_register_fills_description_and_aggregates_fields() {
        let df = DataFrame::new(vec![
            Column::new("ADDR".into(), vec![Some("0x0".to_string()), None]),
            Column::new("REG".into(), vec![Some("CTRL".to_string()), None]),
            Column::new("FIELD".into(), vec![Some("EN".to_string()), Some("MODE".to_string())]),
            Column::new("BIT".into(), vec![Some("[0]".to_string()), Some("[2:1]".to_string())]),
            Column::new("WIDTH".into(), vec![Some("1".to_string()), Some("2".to_string())]),
            Column::new("ATTRIBUTE".into(), vec![Some("RW".to_string()), Some("RW".to_string())]),
            Column::new("DEFAULT".into(), vec![Some("0".to_string()), Some("0".to_string())]),
            Column::new("DESCRIPTION".into(), vec![None, Some("Mode bits".to_string())]),
        ])
        .expect("df");

        let parsed = parse_register(df).expect("parse");
        assert_eq!(parsed.height(), 1);

        let reg = parsed
            .column("REG")
            .expect("REG")
            .str()
            .expect("REG str")
            .get(0)
            .expect("REG value");
        assert_eq!(reg, "CTRL");

        let reg_width = parsed
            .column("REG_WIDTH")
            .expect("REG_WIDTH")
            .str()
            .expect("REG_WIDTH str")
            .get(0)
            .expect("REG_WIDTH value");
        assert_eq!(reg_width, "3");

        let desc_series_string = format!(
            "{:?}",
            parsed
                .column("DESCRIPTION")
                .expect("DESCRIPTION")
                .as_materialized_series()
        );
        assert!(desc_series_string.contains("No Description"));
        assert!(desc_series_string.contains("Mode bits"));
    }
}
