variable "billing_account" {
  description = "The ID of the billing account to associate projects with"
  type        = string
  default     = "013D81-5DE460-A7D91B"
}

variable "org_id" {
  description = "The organization id for the associated resources"
  type        = string
  default     = "492955507532"
}

variable "billing_project" {
  description = "The project id to use for billing"
  type        = string
  default     = "cs-host-f159205864a44e5e82f09b"
}

variable "folders" {
  description = "Folder structure as a map"
  type        = map
}
