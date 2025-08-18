terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.44"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

resource "hcloud_server" "countdowns" {
  name        = "countdowns"
  image       = "ubuntu-22.04"
  server_type = "cx11"
  location    = "nbg1"
  user_data   = file("${path.module}/../../cloud-init/hetzner.yaml")
}
