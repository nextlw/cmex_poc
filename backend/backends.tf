terraform {
  backend "gcs" {
    bucket = "cs-tfstate-southamerica-east1-b0a6b7bd92a344db961af1656b4d06"
    prefix = "terraform"
  }
}
