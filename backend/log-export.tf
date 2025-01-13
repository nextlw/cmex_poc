# random suffix to prevent collisions
resource "random_id" "suffix" {
  byte_length = 4
}

module "cs-logsink-logbucketsink" {
  source  = "terraform-google-modules/log-export/google"
  version = "~> 8.0"

  destination_uri      = module.cs-logging-destination.destination_uri
  log_sink_name        = "${var.org_id}-logbucketsink-${random_id.suffix.hex}"
  parent_resource_id   = var.org_id
  parent_resource_type = "organization"
  include_children     = true
  filter               = "logName: /logs/cloudaudit.googleapis.com%2Factivity OR logName: /logs/cloudaudit.googleapis.com%2Fsystem_event OR logName: /logs/cloudaudit.googleapis.com%2Fdata_access OR logName: /logs/cloudaudit.googleapis.com%2Faccess_transparency"
}

module "cs-logging-destination" {
  source  = "terraform-google-modules/log-export/google//modules/logbucket"
  version = "~> 8.0"

  project_id               = module.cs-project-logging-monitoring.project_id
  name                     = "hdmscontabil-logging"
  location                 = "global"
  retention_days           = 30
  log_sink_writer_identity = module.cs-logsink-logbucketsink.writer_identity
}

module "cs-logsink-pubsubsink" {
  source  = "terraform-google-modules/log-export/google"
  version = "~> 8.0"

  destination_uri      = module.cs-logging-pubsub-destination.destination_uri
  log_sink_name        = "${var.org_id}-logpubsubsink-${random_id.suffix.hex}"
  parent_resource_id   = var.org_id
  parent_resource_type = "organization"
  include_children     = true
  filter               = "logName: /logs/cloudaudit.googleapis.com%2Factivity OR logName: /logs/cloudaudit.googleapis.com%2Fsystem_event OR logName: /logs/cloudaudit.googleapis.com%2Faccess_transparency"
}

module "cs-logging-pubsub-destination" {
  source  = "terraform-google-modules/log-export/google//modules/pubsub"
  version = "~> 8.0"

  project_id               = module.cs-project-logging-monitoring.project_id
  topic_name               = "logging-audit"
  log_sink_writer_identity = module.cs-logsink-pubsubsink.writer_identity
  create_subscriber        = true
  subscriber_id            = "pubsub-subscriber-${random_id.suffix.hex}"
}
