use register_excel_parser::parse_excel_to_import_data;

#[test]
fn parses_example_workbook_to_import_data() {
    let data = include_bytes!("../../example.xlsx");
    let import_data = parse_excel_to_import_data(data).expect("parse should succeed");

    assert!(!import_data.project.name.trim().is_empty());
    assert!(!import_data.project.vendor.trim().is_empty());
    assert!(!import_data.project.library.trim().is_empty());
    assert!(!import_data.project.version.trim().is_empty());

    assert_eq!(import_data.memory_maps.len(), 1);
    assert_eq!(import_data.memory_maps[0].name, "default_map");
    assert!(!import_data.memory_maps[0].address_blocks.is_empty());

    for blk in &import_data.memory_maps[0].address_blocks {
        assert!(blk.base_address.to_lowercase().starts_with("0x"));
        assert!(blk.range.to_lowercase().starts_with("0x"));
        assert!(!blk.registers.is_empty());
    }
}

