use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
    #[error("Calamine error: {0}")]
    Calamine(#[from] calamine::Error),

    #[error("Xlsx error: {0}")]
    Xlsx(#[from] calamine::XlsxError),

    #[error("Polars error: {0}")]
    Polars(#[from] polars::prelude::PolarsError),

    #[error("Json error: {0}")]
    Json(#[from] serde_json::Error),

    #[error(transparent)]
    Anyhow(#[from] anyhow::Error),

    #[error("IO error: {0}")]
    IO(#[from] std::io::Error),

    #[error("Key Error: Not found for key {0}")]
    NotFound(String),

    #[error("Empty Error: {0}")]
    Empty(String),
}
