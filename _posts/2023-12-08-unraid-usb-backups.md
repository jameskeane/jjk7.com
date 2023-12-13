---
title:  "UNRAID USB Backups"
date:   2023-12-08 18:12:10 -0500
categories:
  - home-server
tags:
  - unraid
  - sysops
  - devops
  - linux
---
Let's talk about how we can set-up reliable backups of our UNRAID server to external (USB) harddrives.

We are going to use a tool called [rsnapshot](https://rsnapshot.org/). rsnapshot
is a snapshot and backup tool based on rsync. It makes extensive use of hardlinks to reduce the on disk size of the snapshots. If you want to learn
more, you can read in depth details in their docs.

## Device configuration
Firstly, UNRAID doesn't natively support unassigned USB disks so you will need to install the "Unassigned Devices" and "Unassigned Devices Plus" plugin. This can be done from the "Apps" menu on the UNRAID dashboard.

 1. Enable destructive mode in the unassigned devices settings
 2. Connect the drive
 3. Erase it completely.
 4. Format it with your desired filesystem (I recommend XFS), name the volume 'Backup'.
 5. Go into the device settings; set it to 'auto-mount', and set the device script.

The device script will restart the rsnapshot docker container, so that docker
will remount the disk at the correct volume. Create a script, somewhere persistent
(`/boot/config/plugins/unassigned.devices/Backup.sh`):

```bash
#!/usr/bin/env bash
docker restart rsnapshot
```

## Docker compose
First, install the ("Docker Compose Manager" plugin](https://forums.unraid.net/topic/114415-plugin-docker-compose-manager/). We are going to be using [docker-rsnapshot](https://rsnapshot.org/).

Make sure that you have a user share called 'config'. Create a docker-compose stack for your backups:
```yaml
name: backups
---
version: "3.8"
services:
  rsnapshot:
    # NOTE: at the time of writing the :latest tag has a bug,
    #       it will probably be fine when you read this, but check.
    image: lscr.io/linuxserver/rsnapshot:1.4.5-r0-ls88
    container_name: rsnapshot
    restart: unless-stopped
    environment:
      - PUID=99
      - PGID=100
      - TZ= # Optional, if you want local timestamps in logs
    volumes:
      - "/mnt/user/config/rsnapshot:/config"
      - "/mnt/disks/Backup:/.snapshots"
      # Backup volumes, mount anything you want to backup
      - "/mnt/user/config:/serverconfig"
      #- "/mnt/user/to-backup:/to-backup"
```

## rsnapshot Configuration
Read up on how to configure rsnapshot, or if you want you can up your backup stack,
and the container will create the requisite config files in `/mnt/user/config/rsnapshot/`.
You will still need to modify them, but there are instructions for each config entry.

The most important part is to make your 'retain' rules, the same as your crontab

Here is an example `rsnapshot.conf`
```shell
config_version  1.2

snapshot_root /.snapshots/

cmd_cp    /bin/cp
cmd_rm    /bin/rm
cmd_rsync /usr/bin/rsync
cmd_logger  /usr/bin/logger
cmd_du    /usr/bin/du

retain  daily 7
retain  weekly  4
retain  monthly 3

verbose   2
loglevel  3
logfile /config/rsnapshot.log

lockfile  /config/rsnapshot.pid
rsync_short_args  -rltD
rsync_long_args --delete --numeric-ids --relative --delete-excluded --no-o --no-g --no-perms
link_dest 1

# List all of your backups and their destinations in the `snapshot_root`
backup  /serverconfig/  localhost/
backup  /to-backup/ localhost/
```

and it's corresponding `crontabs/root`:
```
38  02  * * * /usr/bin/rsnapshot daily
30  01  * * 7 /usr/bin/rsnapshot weekly
30  01  1 * * /usr/bin/rsnapshot monthly 
```

## Offsite
With this strategy in place, after the monthly snapshot is done I will swap it
with a second USB harddrive and take it off-site for cold storage. Swapping the
active monthly. This ensures I have backups even in the case of theft or
complete on-site loss.
