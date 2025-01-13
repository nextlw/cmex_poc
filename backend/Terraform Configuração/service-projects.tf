module "cs-svc-prod1-svc-9z0m" {
  source  = "terraform-google-modules/project-factory/google//modules/svpc_service_project"
  version = "~> 16.0"

  name            = "prod1-service"
  project_id      = "prod1-svc-9z0m"
  org_id          = var.org_id
  billing_account = var.billing_account
  folder_id       = local.folder_map["Production"].id

  shared_vpc = module.cs-vpc-prod-shared.project_id
  shared_vpc_subnets = [
    try(module.cs-vpc-prod-shared.subnets["southamerica-east1/subnet-prod-1"].self_link, ""),
  ]

  domain     = data.google_organization.org.domain
  group_name = module.cs-gg-prod1-service.name
  group_role = "roles/viewer"
  depends_on = [
    module.cs-org-policy-compute_skipDefaultNetworkCreation,
  ]
}

module "cs-svc-prod2-svc-9z0m" {
  source  = "terraform-google-modules/project-factory/google//modules/svpc_service_project"
  version = "~> 16.0"

  name            = "prod2-service"
  project_id      = "prod2-svc-9z0m"
  org_id          = var.org_id
  billing_account = var.billing_account
  folder_id       = local.folder_map["Production"].id

  shared_vpc = module.cs-vpc-prod-shared.project_id
  shared_vpc_subnets = [
    try(module.cs-vpc-prod-shared.subnets["northamerica-northeast2/subnet-prod-2"].self_link, ""),
  ]

  domain     = data.google_organization.org.domain
  group_name = module.cs-gg-prod2-service.name
  group_role = "roles/viewer"
  depends_on = [
    module.cs-org-policy-compute_skipDefaultNetworkCreation,
  ]
}

module "cs-svc-nonprod1-svc-9z0m" {
  source  = "terraform-google-modules/project-factory/google//modules/svpc_service_project"
  version = "~> 16.0"

  name            = "nonprod1-service"
  project_id      = "nonprod1-svc-9z0m"
  org_id          = var.org_id
  billing_account = var.billing_account
  folder_id       = local.folder_map["homolog"].id

  shared_vpc = module.cs-vpc-nonprod-shared.project_id
  shared_vpc_subnets = [
    try(module.cs-vpc-nonprod-shared.subnets["southamerica-east1/subnet-non-prod-1"].self_link, ""),
  ]

  domain     = data.google_organization.org.domain
  group_name = module.cs-gg-nonprod1-service.name
  group_role = "roles/viewer"
  depends_on = [
    module.cs-org-policy-compute_skipDefaultNetworkCreation,
  ]
}

module "cs-svc-nonprod2-svc-9z0m" {
  source  = "terraform-google-modules/project-factory/google//modules/svpc_service_project"
  version = "~> 16.0"

  name            = "nonprod2-service"
  project_id      = "nonprod2-svc-9z0m"
  org_id          = var.org_id
  billing_account = var.billing_account
  folder_id       = local.folder_map["homolog"].id

  shared_vpc = module.cs-vpc-nonprod-shared.project_id
  shared_vpc_subnets = [
    try(module.cs-vpc-nonprod-shared.subnets["northamerica-northeast2/subnet-non-prod-2"].self_link, ""),
  ]

  domain     = data.google_organization.org.domain
  group_name = module.cs-gg-nonprod2-service.name
  group_role = "roles/viewer"
  depends_on = [
    module.cs-org-policy-compute_skipDefaultNetworkCreation,
  ]
}
