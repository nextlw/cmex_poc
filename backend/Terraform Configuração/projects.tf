module "cs-project-vpc-host-prod" {
  source  = "terraform-google-modules/project-factory/google"
  version = "~> 16.0"

  name       = "vpc-host-prod"
  project_id = "vpc-host-prod-as596-lu715"
  org_id     = var.org_id
  folder_id  = local.folder_map["Production"].id

  billing_account                = var.billing_account
  enable_shared_vpc_host_project = true
  depends_on = [
    module.cs-org-policy-compute_skipDefaultNetworkCreation,
  ]
}

module "cs-project-vpc-host-nonprod" {
  source  = "terraform-google-modules/project-factory/google"
  version = "~> 16.0"

  name       = "vpc-host-nonprod"
  project_id = "vpc-host-nonprod-ke374-lr967"
  org_id     = var.org_id
  folder_id  = local.folder_map["homolog"].id

  billing_account                = var.billing_account
  enable_shared_vpc_host_project = true
  depends_on = [
    module.cs-org-policy-compute_skipDefaultNetworkCreation,
  ]
}

module "cs-project-logging-monitoring" {
  source  = "terraform-google-modules/project-factory/google"
  version = "~> 16.0"

  name       = "central-logging-monitoring"
  project_id = "central-log-monitor-cb767-ni03"
  org_id     = var.org_id
  folder_id  = local.folder_map["Common"].id

  billing_account = var.billing_account
  depends_on = [
    module.cs-org-policy-compute_skipDefaultNetworkCreation,
  ]
  activate_apis = [
    "compute.googleapis.com",
    "monitoring.googleapis.com",
  ]
}

module "cs-cool-adviser-447700-k6" {
  source  = "terraform-google-modules/project-factory/google"
  version = "~> 16.0"

  name       = "vpc-host-dev"
  project_id = "cool-adviser-447700-k6"
  org_id     = var.org_id
  folder_id  = local.folder_map["Development"].id

  billing_account = var.billing_account
  depends_on = [
    module.cs-org-policy-compute_skipDefaultNetworkCreation,
  ]
}
