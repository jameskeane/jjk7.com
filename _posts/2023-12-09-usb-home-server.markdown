---
title:  "UNRAID Home Server"
date:   2023-12-09 01:12:10 -0500
categories:
  - home-server
tags:
  - terra-master
  - unraid
  - sysops
  - devops
  - linux
---
In this post I will talk about my experiences and hard learned lessons. This
guide is appropriate for technical users, who are comfortable editing nginx and
docker-compose config files.

Depending on your storage needs cloud storage and hosting might be completely
reasonable, but it _quickly_ becomes uneconomical. For example, 20TB on Google
is $1100 a year, equivalent to buying 64TB worth of harddrives every year!

**tldr;** Buy an off the shelf NAS (ex. [TerraMaster NAS](https://www.terra-master.com/global/products/f5-422-10g-nas.html)),
buy a couple harddrives, install UNRAID, use Docker Compose for everything, and
rsnapshot for backups.

## Installing UNRAID
I have had a bad experience with the default TerraMaster operation system (TOS 5)
that resulted in a filesystem corruption, and the first thing their support team
recommended was a destructive repair command (`btrfs check --repair`). And a
minor update removed support for the `dri` GPU device, with no way to re-enable
it. UNRAID's parity storage is also superior to TOS' mdadm RAID, as it
multi-plexes multiple independent filesystems it is more resilient to
corruption.

 1. Get a small USB thumb stick, like the [SanDisk 32GB Ultra Fit](https://www.amazon.ca/dp/B077VXV323).
 2. Use the [manual install method](https://docs.unraid.net/unraid-os/getting-started/manual-install-method/) to create the bootdisk.
 3. Remove all drives, and open your NAS. Locate the USB thumbstick and replace it
    with the UNRAID bootdisk.
 4. Start the device, find it's IP, go to the browser and follow the instructions.

## Secure Web Application Gateway (SWAG)
If you want to access your home server outside of your local network you will
need to set-up [SWAG](https://docs.linuxserver.io/general/swag/).

If you have a dynamic IP, set up [duckdns](https://www.duckdns.org/). If you want
your own domain, CNAME it to the duckdns subdomain and add it to the `EXTRA_DOMAINS` variable to get a certificate for it.

Below is an example docker compose stack for this.
```yaml
version: "3.8"
name: frontend
services:
  duckdns:
    image: lscr.io/linuxserver/duckdns:latest
    container_name: duckdns
    restart: unless-stopped
    network_mode: host
    environment:
      - PUID=99
      - PGID=100
      - TZ= #optional, your timezone
      - UPDATE_IP=ipv4
      - LOG_FILE=false
      - SUBDOMAINS= # your subdomain
      - TOKEN= # your token
    volumes:
      - /mnt/user/config/frontend/duckdns:/config
  swag:
    image: lscr.io/linuxserver/swag:latest
    container_name: swag
    restart: unless-stopped
    cap_add:
      - NET_ADMIN
    environment:
      - PUID=99
      - PGID=100
      - TZ= #optional, your timezone
      - URL=duckdns.org
      - ONLY_SUBDOMAINS=true
      - VALIDATION=http
      - SUBDOMAINS= # your subdomain
      - EXTRA_DOMAINS= # optional, extra domains
    volumes:
      - /mnt/user/config/frontend:/config
    ports:
      - 4433:443
      - 81:80
```

## Application Stacks
I run three stacks:
 1. Home media server - [Plex](https://docs.linuxserver.io/images/docker-plex/), [Sonarr](https://docs.linuxserver.io/images/docker-sonarr), [Radarr](https://docs.linuxserver.io/images/docker-radarr/), [Sabnzbd](https://docs.linuxserver.io/images/docker-sabnzbd/), [Transmission](https://docs.linuxserver.io/images/docker-transmission/)
 2. Photo server - [Immich](https://github.com/immich-app/immich)
 3. Backups - [rsnapshot](https://docs.linuxserver.io/images/docker-rsnapshot/), [CrashPlan Pro](https://github.com/jlesage/docker-crashplan-pro)

## Backups
There are really two reasonably affordable options:

#### [Crashplan Pro](https://www.crashplan.com/crashplan-professional/) - $10/mo
For $10/mo, it's unbeatable. You get unlimited cloud backups and no transfer or
recovery costs. For a modest 16TB array Amazon S3 Glacier would by $64/mo! I
can't speak to it's recovery consistency as I've never tested a large recovery.
I mainly use this for extremely critical data as recovering from the internet
would take way too long for my array. Like everything else, it can be used in a
[docker container](https://github.com/jlesage/docker-crashplan-pro).

#### External Disk Swap
Depending on your array size this can be very economical once the initial cost
is accounted for. The set up is thus:
  - Two USB drives (A & B), each large enough to store your entire array.
  - Run a daily, weekly, and monthly [rsnapshot](https://rsnapshot.org/) on to
    USB drive A.
  - When the monthly snapshot has completed, swap A for B and cold storage A
    somewhere offsite. A bank safety deposit is good.
  - Continue running the snapshots on B, and swap every month.

For more details on this strategy see my full writeup on [USB Backups](/home-server/2023/12/08/unraid-usb-backups.html).
