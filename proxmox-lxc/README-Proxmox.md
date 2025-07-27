# BookTracker Proxmox LXC Container Deployment

This directory contains all the necessary files and scripts to deploy the BookTracker application in a Proxmox LXC container.

## Overview

Proxmox LXC containers provide a lightweight alternative to full virtualization, offering:
- **Lower resource usage** compared to VMs
- **Better performance** for static web applications
- **Container-level isolation** with shared kernel
- **Easy backup and snapshot capabilities**
- **Simple network configuration**
- **Direct integration with Proxmox VE**

## Files Included

- **`setup-booktracker-lxc.sh`** - Automated LXC container creation and basic setup
- **`deploy-to-lxc.sh`** - Deploy BookTracker application to existing container
- **`lxc-config-template.conf`** - LXC container configuration template
- **`nginx-booktracker.conf`** - Nginx configuration for the application
- **`README-Proxmox.md`** - This documentation file

## Quick Start

### Prerequisites

1. **Proxmox VE Server** with root access
2. **Container template** downloaded (Ubuntu 22.04 recommended)
3. **Network bridge** configured (typically `vmbr0`)
4. **Storage** available for container (local-lvm, ZFS, etc.)

### Step 1: Download Container Template

On your Proxmox host, download the Ubuntu template:

```bash
# Update template list
pveam update

# Download Ubuntu 22.04 template
pveam download local ubuntu-22.04-standard_22.04-1_amd64.tar.xz
```

### Step 2: Create and Setup Container

```bash
# Copy scripts to Proxmox host
scp -r proxmox-lxc/ root@your-proxmox-host:/root/

# SSH to Proxmox host
ssh root@your-proxmox-host

# Run the setup script
cd /root/proxmox-lxc/
./setup-booktracker-lxc.sh
```

### Step 3: Deploy Application

```bash
# Deploy BookTracker to the container (adjust container ID as needed)
./deploy-to-lxc.sh 200
```

### Step 4: Access Application

Open your browser and navigate to the container's IP address.

## Detailed Usage

### Container Creation Script

The `setup-booktracker-lxc.sh` script supports various options:

```bash
# Basic usage with defaults
./setup-booktracker-lxc.sh

# Custom configuration
./setup-booktracker-lxc.sh -i 201 -n webapp -m 1024 -d 8

# Static IP configuration
./setup-booktracker-lxc.sh --ip 192.168.1.100/24 --gateway 192.168.1.1

# Full options
./setup-booktracker-lxc.sh \
    --id 200 \
    --name booktracker \
    --storage local-lvm \
    --memory 512 \
    --disk 4 \
    --cores 1 \
    --bridge vmbr0 \
    --ip 192.168.1.100/24 \
    --gateway 192.168.1.1
```

#### Script Options

| Option | Description | Default |
|--------|-------------|---------|
| `-i, --id` | Container ID | 200 |
| `-n, --name` | Container hostname | booktracker |
| `-s, --storage` | Storage pool | local-lvm |
| `-p, --password` | Root password | booktracker123 |
| `-m, --memory` | Memory in MB | 512 |
| `-d, --disk` | Disk size in GB | 4 |
| `-c, --cores` | CPU cores | 1 |
| `-b, --bridge` | Network bridge | vmbr0 |
| `--ip` | Static IP (CIDR) | DHCP |
| `--gateway` | Gateway IP | - |

### Deployment Script

The `deploy-to-lxc.sh` script copies your BookTracker application to the container:

```bash
# Deploy to container 200
./deploy-to-lxc.sh 200

# Deploy from custom source directory
./deploy-to-lxc.sh 200 -s /path/to/booktracker/

# Deploy to custom target directory
./deploy-to-lxc.sh 200 -t /var/www/html/
```

## Manual Setup Instructions

If you prefer manual setup or need to customize the process:

### 1. Create Container Manually

```bash
# Create container
pct create 200 local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.xz \
    --hostname booktracker \
    --password yourpassword \
    --memory 512 \
    --rootfs local-lvm:4 \
    --cores 1 \
    --net0 name=eth0,bridge=vmbr0,ip=dhcp \
    --unprivileged 1 \
    --onboot 1 \
    --features nesting=1

# Start container
pct start 200
```

### 2. Install Software

```bash
# Enter container
pct enter 200

# Update system
apt update && apt upgrade -y

# Install Nginx
apt install -y nginx curl wget unzip

# Enable and start Nginx
systemctl enable nginx
systemctl start nginx
```

### 3. Configure Nginx

```bash
# Create application directory
mkdir -p /var/www/booktracker

# Copy nginx configuration
cp nginx-booktracker.conf /etc/nginx/sites-available/booktracker

# Enable site
ln -sf /etc/nginx/sites-available/booktracker /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload
nginx -t
systemctl reload nginx
```

### 4. Deploy Application Files

```bash
# From Proxmox host, copy files to container
pct push 200 /path/to/index.html /var/www/booktracker/index.html
pct push 200 /path/to/script.js /var/www/booktracker/script.js
pct push 200 /path/to/styles.css /var/www/booktracker/styles.css

# Set permissions
pct exec 200 -- chown -R www-data:www-data /var/www/booktracker
pct exec 200 -- chmod -R 755 /var/www/booktracker
```

## Container Management

### Basic Commands

```bash
# Container lifecycle
pct start 200          # Start container
pct stop 200           # Stop container
pct restart 200        # Restart container
pct destroy 200        # Delete container (permanent!)

# Access container
pct console 200        # Console access
pct enter 200          # Shell access

# Container information
pct status 200         # Show status
pct config 200         # Show configuration
pct list               # List all containers
```

### Monitoring

```bash
# View resource usage
pct exec 200 -- htop

# Check nginx status
pct exec 200 -- systemctl status nginx

# View nginx logs
pct exec 200 -- tail -f /var/log/nginx/access.log
pct exec 200 -- tail -f /var/log/nginx/error.log

# Check application availability
pct exec 200 -- curl -I http://localhost
```

### Backup and Restore

```bash
# Create backup
vzdump 200 --storage local --mode snapshot

# List backups
ls /var/lib/vz/dump/

# Restore from backup
pct restore 201 /var/lib/vz/dump/vzdump-lxc-200-2024_01_01-12_00_00.tar.zst

# Create snapshot
pct snapshot 200 before-update

# Rollback to snapshot
pct rollback 200 before-update
```

## Network Configuration

### DHCP (Default)

```bash
net0: name=eth0,bridge=vmbr0,ip=dhcp,type=veth
```

### Static IP

```bash
net0: name=eth0,bridge=vmbr0,ip=192.168.1.100/24,gw=192.168.1.1,type=veth
```

### Multiple Networks

```bash
net0: name=eth0,bridge=vmbr0,ip=dhcp,type=veth
net1: name=eth1,bridge=vmbr1,ip=10.0.0.100/24,type=veth
```

## Security Considerations

### Container Security

1. **Use unprivileged containers** (default in our scripts)
2. **Enable AppArmor** (enabled by default)
3. **Regular updates** of container OS and packages
4. **Strong passwords** and SSH key authentication
5. **Firewall rules** at Proxmox level

### Application Security

1. **HTTPS setup** (optional, see nginx config)
2. **Security headers** (included in nginx config)
3. **File permissions** (handled by scripts)
4. **Access restrictions** (configure as needed)

## Performance Tuning

### Resource Allocation

```bash
# Increase memory
pct set 200 -memory 1024

# Add CPU cores
pct set 200 -cores 2

# Adjust CPU limit
pct set 200 -cpulimit 1.5

# Modify disk size (requires shutdown)
pct set 200 -rootfs local-lvm:8
```

### Nginx Optimization

```bash
# Inside container, edit /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 1024;

# Enable caching
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Troubleshooting

### Common Issues

#### Container won't start
```bash
# Check container configuration
pct config 200

# View container logs
journalctl -u pve-container@200

# Check storage space
df -h
```

#### Network issues
```bash
# Check network configuration
pct exec 200 -- ip addr
pct exec 200 -- ip route

# Test connectivity
pct exec 200 -- ping 8.8.8.8
```

#### Nginx issues
```bash
# Test nginx configuration
pct exec 200 -- nginx -t

# Check nginx status
pct exec 200 -- systemctl status nginx

# View nginx error logs
pct exec 200 -- tail /var/log/nginx/error.log
```

#### Permission issues
```bash
# Fix web directory permissions
pct exec 200 -- chown -R www-data:www-data /var/www/booktracker
pct exec 200 -- chmod -R 755 /var/www/booktracker
```

### Log Files

Important log locations within the container:
- **Nginx access log**: `/var/log/nginx/access.log`
- **Nginx error log**: `/var/log/nginx/error.log`
- **System logs**: `/var/log/syslog`
- **Auth logs**: `/var/log/auth.log`

## Comparison: Docker vs LXC

| Feature | Docker Container | Proxmox LXC |
|---------|------------------|-------------|
| **Resource Usage** | Higher overhead | Lower overhead |
| **Startup Time** | Fast | Very fast |
| **Isolation** | Process-level | Container-level |
| **Networking** | NAT/Bridge | Direct bridge |
| **Management** | Docker CLI | Proxmox GUI/CLI |
| **Backup** | Image-based | File-based |
| **Snapshots** | Yes | Yes |
| **Live Migration** | No | Yes |
| **GUI Management** | Limited | Full Proxmox GUI |
| **Resource Monitoring** | External tools | Built-in |

## Migration from Docker

If you're migrating from the Docker setup:

1. **Export application files** from Docker container
2. **Create LXC container** using our scripts
3. **Deploy files** using the deployment script
4. **Update any absolute paths** in your application
5. **Test functionality** thoroughly

## Production Recommendations

### High Availability Setup

1. **Multiple containers** behind a load balancer
2. **Shared storage** for application files
3. **Database replication** (if adding backend)
4. **Monitoring and alerting**
5. **Automated backups**

### Scaling

1. **Horizontal scaling**: Multiple containers
2. **Vertical scaling**: Increase container resources
3. **Load balancing**: HAProxy or Nginx proxy
4. **CDN integration**: For static assets

## Support and Resources

- **Proxmox VE Documentation**: https://pve.proxmox.com/wiki/
- **LXC Documentation**: https://linuxcontainers.org/lxc/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Ubuntu LXC Templates**: Available via pveam

## Conclusion

The Proxmox LXC deployment option provides an excellent balance of performance, resource efficiency, and management capabilities for the BookTracker application. It's particularly well-suited for:

- **Production deployments** requiring high availability
- **Multi-tenant environments** with resource isolation
- **Organizations using Proxmox VE** infrastructure
- **Applications requiring minimal overhead**

Choose LXC when you need the benefits of containerization with the performance and management features of Proxmox VE.

