# Aerealith Talos Kubernetes VM Bootstrap Guide

This runbook documents the **repeatable, copy/paste bootstrap procedure** for the Aerealith self-hosted Kubernetes cluster running **Talos Linux on Proxmox VE**.

It is intentionally specific to the Aerealith production cluster and records the configuration that has already been validated successfully.

> **Important**
>
> - Talos installation writes to `/dev/sda`.
> - `talosctl bootstrap` is a **one-time operation** for a new cluster.
> - Never commit `secrets.yaml`, `talosconfig`, `kubeconfig`, or generated machine configuration containing credentials.
> - Commands using `--insecure` are only for Talos nodes that are still in **maintenance mode** before their permanent machine configuration has been installed.
> - Once a node has its permanent configuration, use authenticated `talosctl` access.
> - Control-plane nodes must remain distributed across separate Proxmox hosts to preserve etcd quorum during a physical-host failure.

---

## 1. Validated software versions

This runbook is currently pinned to:

| Component   |                              Version |
| ----------- | -----------------------------------: |
| Talos Linux |                            `v1.13.9` |
| Kubernetes  |                            `v1.36.3` |
| Cilium      |                             `1.20.1` |
| Helm        | `v3.21.x` or newer compatible Helm 3 |
| containerd  |                        Talos-managed |
| etcd        |             Talos/Kubernetes-managed |

Talos installer image used by this cluster:

```text
factory.talos.dev/metal-installer/ce4c980550dd2ab1b17bbf2b08801c7eb59418eafe8f279833297925d67c7515:v1.13.9
```

The Image Factory schematic includes:

```text
siderolabs/qemu-guest-agent
```

Do not blindly upgrade one component in isolation. Review Talos, Kubernetes, and Cilium compatibility before changing these pins.

---

# 2. Cluster architecture

## Physical LAN

```text
LAN:       10.42.0.0/24
Gateway:   10.42.0.1
```

The Kubernetes nodes are on the existing flat LAN. No VLANs are required by this runbook.

## Kubernetes networking

```text
Kubernetes API VIP:  10.42.0.60
Pod CIDR:            10.200.0.0/16
Service CIDR:        10.201.0.0/16
Node interface:      ens18
Talos install disk:  /dev/sda
```

The Kubernetes API endpoint is:

```text
https://10.42.0.60:6443
```

The Talos API is **not** accessed through the Kubernetes VIP. `talosctl` should use the individual control-plane addresses:

```text
10.42.0.70
10.42.0.71
10.42.0.72
```

---

# 3. Node inventory

The DHCP addresses below are the addresses used while each VM boots the Talos installer ISO in maintenance mode.

The static address becomes active after its machine configuration is applied.

| Node            | Role          | Maintenance/DHCP | Permanent IP | Disk       | NIC     |
| --------------- | ------------- | ---------------: | -----------: | ---------- | ------- |
| `k8s-cp-01`     | Control plane |     `10.42.0.24` | `10.42.0.70` | `/dev/sda` | `ens18` |
| `k8s-cp-02`     | Control plane |     `10.42.0.25` | `10.42.0.71` | `/dev/sda` | `ens18` |
| `k8s-cp-03`     | Control plane |     `10.42.0.28` | `10.42.0.72` | `/dev/sda` | `ens18` |
| `k8s-worker-01` | Worker        |     `10.42.0.26` | `10.42.0.80` | `/dev/sda` | `ens18` |
| `k8s-worker-02` | Worker        |     `10.42.0.29` | `10.42.0.81` | `/dev/sda` | `ens18` |
| `k8s-worker-03` | Worker        |     `10.42.0.27` | `10.42.0.82` | `/dev/sda` | `ens18` |
| `k8s-worker-04` | Worker        |     `10.42.0.30` | `10.42.0.83` | `/dev/sda` | `ens18` |

> DHCP addresses are useful for this installation, but do not assume they will remain identical after deleting/recreating a VM. Verify the maintenance-mode IP in the Talos console before applying a configuration.

---

# 4. Proxmox placement

At minimum, keep one control plane on each physical Proxmox host:

```text
pve-01
└── k8s-cp-01

pve-02
└── k8s-cp-02

pve-03
└── k8s-cp-03
```

Workers should be spread across the physical hosts according to available CPU and RAM.

Do not intentionally place two control-plane VMs on the same physical host unless operating temporarily during maintenance.

---

# 5. Proxmox VM settings

Use the following baseline for each Talos VM.

## Firmware and machine

```text
BIOS:          OVMF / UEFI
Machine:       q35
Sockets:       1
CPU Type:      host
```

## CPU and memory

Talos upstream baseline guidance is:

```text
Control plane: 2+ CPU cores, 4+ GiB RAM
Worker:        4+ CPU cores, 8+ GiB RAM
```

Allocate more according to actual workload requirements.

For control planes, prioritize predictable resources over overcommit.

Disable:

```text
Memory Ballooning
Memory Hotplug
```

## Network adapter

```text
Model:   VirtIO
Bridge:  vmbr0
```

The interface is expected to appear to Talos as:

```text
ens18
```

Always verify this before applying the configuration.

## Disk

The cluster configuration expects:

```text
/dev/sda
```

Use a Proxmox disk/controller combination that presents the Talos system disk as `/dev/sda`.

Before installation, verify the disk from Talos maintenance mode:

```bash
talosctl get disks \
  --insecure \
  --nodes <MAINTENANCE_IP>
```

**Do not continue if the disk you intend Talos to overwrite is not `/dev/sda`.**

## QEMU Guest Agent

The Talos ISO and installer image used here include:

```text
siderolabs/qemu-guest-agent
```

Therefore QEMU Guest Agent may be enabled in the Proxmox VM options.

Verify the extension from maintenance mode:

```bash
talosctl get extensions \
  --insecure \
  --nodes <MAINTENANCE_IP>
```

Expected:

```text
qemu-guest-agent
schematic
```

## Boot order

During initial installation, the VM needs to boot the Talos ISO.

After Talos has been installed, make the system disk the first boot device or eject the ISO.

Recommended final state:

```text
1. Talos system disk
2. CD/DVD drive, disabled or empty
```

The safest final configuration is:

```text
CD/DVD Drive -> Do not use any media
```

Do **not** delete the virtual CD/DVD device simply to eject the ISO.

---

# 6. Build or obtain the Talos ISO

Use the Talos Image Factory:

- Talos version: `v1.13.9`
- Architecture: `amd64`
- Platform: `metal`
- Extension: `siderolabs/qemu-guest-agent`

The current cluster schematic ID is:

```text
ce4c980550dd2ab1b17bbf2b08801c7eb59418eafe8f279833297925d67c7515
```

After creating the image, retain both:

1. the generated ISO URL
2. the generated installer image URL

The installer image used by `common.yaml` must correspond to the extensions in the ISO.

Current installer:

```text
factory.talos.dev/metal-installer/ce4c980550dd2ab1b17bbf2b08801c7eb59418eafe8f279833297925d67c7515:v1.13.9
```

Upload the ISO to Proxmox storage and mount it to each Talos VM.

---

# 7. Boot every VM into Talos maintenance mode

Start each VM.

The Talos console should show that the node is in maintenance mode and should display its DHCP address.

From the Aerealith development workstation, verify each maintenance-mode Talos API.

Example:

```bash
talosctl version \
  --insecure \
  --nodes 10.42.0.24
```

Check the system disk:

```bash
talosctl get disks \
  --insecure \
  --nodes 10.42.0.24
```

Check extensions:

```bash
talosctl get extensions \
  --insecure \
  --nodes 10.42.0.24
```

Repeat these checks for each VM.

---

# 8. Repository layout

From the Aerealith repository root:

```text
infra/talos/
├── patches/
│   ├── common.yaml
│   ├── cp-01.yaml
│   ├── cp-02.yaml
│   ├── cp-03.yaml
│   ├── worker-01.yaml
│   ├── worker-02.yaml
│   ├── worker-03.yaml
│   └── worker-04.yaml
├── generated/
│   ├── base/
│   └── nodes/
├── recovery/
└── readme.md
```

Run all commands in this guide from:

```bash
cd /mnt/disk-sdc/Projects/Aerealith
```

This avoids the path mistakes that occur when running commands from `infra/talos` while still prefixing paths with `infra/talos/`.

---

# 9. Protect generated credentials

Add the following to the repository `.gitignore` if it is not already present:

```gitignore
# Talos generated credentials and machine configuration
infra/talos/generated/
infra/talos/recovery/
infra/talos/secrets.yaml
infra/talos/talosconfig
infra/talos/kubeconfig
```

The patch files are intended to remain in Git.

The following are **secrets** and must not be committed:

```text
secrets.yaml
talosconfig
kubeconfig
generated machine configs containing credentials
```

Create the directories:

```bash
cd /mnt/disk-sdc/Projects/Aerealith

mkdir -p \
  infra/talos/generated/base \
  infra/talos/generated/nodes \
  infra/talos/recovery

chmod 700 infra/talos/recovery
umask 077
```

---

# 10. Talos common patch

Create:

```text
infra/talos/patches/common.yaml
```

with:

```yaml
cluster:
  allowSchedulingOnControlPlanes: false

  network:
    cni:
      name: none

    podSubnets:
      - 10.200.0.0/16

    serviceSubnets:
      - 10.201.0.0/16

machine:
  install:
    disk: /dev/sda
    image: factory.talos.dev/metal-installer/ce4c980550dd2ab1b17bbf2b08801c7eb59418eafe8f279833297925d67c7515:v1.13.9

  kubelet:
    nodeIP:
      validSubnets:
        - 10.42.0.0/24
```

Important behavior:

```text
allowSchedulingOnControlPlanes: false
```

keeps ordinary workloads off the control-plane nodes.

```text
cni.name: none
```

prevents Talos from installing a default CNI. Cilium is installed manually during bootstrap and later managed through GitOps.

---

# 11. Control-plane patches

## cp-01

Create:

```text
infra/talos/patches/cp-01.yaml
```

```yaml
apiVersion: v1alpha1
kind: HostnameConfig
hostname: k8s-cp-01.local.sinlessindustries.com

---
apiVersion: v1alpha1
kind: LinkConfig
name: ens18
up: true
addresses:
  - address: 10.42.0.70/24
routes:
  - gateway: 10.42.0.1

---
apiVersion: v1alpha1
kind: Layer2VIPConfig
name: 10.42.0.60
link: ens18
```

## cp-02

Create:

```text
infra/talos/patches/cp-02.yaml
```

```yaml
apiVersion: v1alpha1
kind: HostnameConfig
hostname: k8s-cp-02.local.sinlessindustries.com

---
apiVersion: v1alpha1
kind: LinkConfig
name: ens18
up: true
addresses:
  - address: 10.42.0.71/24
routes:
  - gateway: 10.42.0.1

---
apiVersion: v1alpha1
kind: Layer2VIPConfig
name: 10.42.0.60
link: ens18
```

## cp-03

Create:

```text
infra/talos/patches/cp-03.yaml
```

```yaml
apiVersion: v1alpha1
kind: HostnameConfig
hostname: k8s-cp-03.local.sinlessindustries.com

---
apiVersion: v1alpha1
kind: LinkConfig
name: ens18
up: true
addresses:
  - address: 10.42.0.72/24
routes:
  - gateway: 10.42.0.1

---
apiVersion: v1alpha1
kind: Layer2VIPConfig
name: 10.42.0.60
link: ens18
```

The Layer-2 VIP belongs on **all three control planes**.

Do not place it on workers.

Do not configure `auto: off` alongside `hostname:`. Talos treats those fields as mutually exclusive.

---

# 12. Worker patches

## worker-01

Create:

```text
infra/talos/patches/worker-01.yaml
```

```yaml
apiVersion: v1alpha1
kind: HostnameConfig
hostname: k8s-worker-01.local.sinlessindustries.com

---
apiVersion: v1alpha1
kind: LinkConfig
name: ens18
up: true
addresses:
  - address: 10.42.0.80/24
routes:
  - gateway: 10.42.0.1
```

## worker-02

Create:

```text
infra/talos/patches/worker-02.yaml
```

```yaml
apiVersion: v1alpha1
kind: HostnameConfig
hostname: k8s-worker-02.local.sinlessindustries.com

---
apiVersion: v1alpha1
kind: LinkConfig
name: ens18
up: true
addresses:
  - address: 10.42.0.81/24
routes:
  - gateway: 10.42.0.1
```

## worker-03

Create:

```text
infra/talos/patches/worker-03.yaml
```

```yaml
apiVersion: v1alpha1
kind: HostnameConfig
hostname: k8s-worker-03.local.sinlessindustries.com

---
apiVersion: v1alpha1
kind: LinkConfig
name: ens18
up: true
addresses:
  - address: 10.42.0.82/24
routes:
  - gateway: 10.42.0.1
```

## worker-04

Create:

```text
infra/talos/patches/worker-04.yaml
```

```yaml
apiVersion: v1alpha1
kind: HostnameConfig
hostname: k8s-worker-04.local.sinlessindustries.com

---
apiVersion: v1alpha1
kind: LinkConfig
name: ens18
up: true
addresses:
  - address: 10.42.0.83/24
routes:
  - gateway: 10.42.0.1
```

---

# 13. Validate patch source before generating credentials

Check that no node patch contains an invalid `auto:` field:

```bash
grep -Rni 'auto:' infra/talos/patches
```

Expected:

```text
no output
```

Review all addresses:

```bash
grep -RniE \
  'hostname:|address:|gateway:|Layer2VIPConfig|name: 10\.42\.0\.60|link: ens18' \
  infra/talos/patches
```

---

# 14. Generate Talos cluster secrets

## First creation only

Create the cluster secrets **once**:

```bash
cd /mnt/disk-sdc/Projects/Aerealith

test ! -e infra/talos/recovery/secrets.yaml || {
  echo "ERROR: infra/talos/recovery/secrets.yaml already exists."
  echo "Do not overwrite an existing cluster secrets bundle."
  exit 1
}

talosctl gen secrets \
  --output-file infra/talos/recovery/secrets.yaml

chmod 600 infra/talos/recovery/secrets.yaml
```

Back this file up securely outside the repository.

Do not regenerate it for an existing cluster unless intentionally rebuilding the entire cluster PKI.

---

# 15. Generate base Talos configuration

Clear only generated output:

```bash
rm -rf \
  infra/talos/generated/base \
  infra/talos/generated/nodes

mkdir -p \
  infra/talos/generated/base \
  infra/talos/generated/nodes
```

Generate the base Talos machine configurations:

```bash
talosctl gen config \
  aerealith-production \
  https://10.42.0.60:6443 \
  --with-secrets infra/talos/recovery/secrets.yaml \
  --config-patch @infra/talos/patches/common.yaml \
  --additional-sans 10.42.0.60 \
  --output-dir infra/talos/generated/base \
  --with-docs=false \
  --with-examples=false
```

Expected files:

```text
infra/talos/generated/base/controlplane.yaml
infra/talos/generated/base/worker.yaml
infra/talos/generated/base/talosconfig
```

Verify:

```bash
ls -lah infra/talos/generated/base
```

---

# 16. Preserve the Talos client configuration

Copy the generated client configuration to the protected recovery directory:

```bash
cp \
  infra/talos/generated/base/talosconfig \
  infra/talos/recovery/talosconfig

chmod 600 infra/talos/recovery/talosconfig
```

Export it for the current shell:

```bash
export TALOSCONFIG="$PWD/infra/talos/recovery/talosconfig"
```

Check:

```bash
talosctl config info
```

Before endpoints are configured, this may show:

```text
Nodes:       not defined
Endpoints:   not defined
```

That is normal.

---

# 17. Render final machine configurations

## Control planes

```bash
for i in 01 02 03; do
  talosctl machineconfig patch \
    infra/talos/generated/base/controlplane.yaml \
    --patch @infra/talos/patches/cp-${i}.yaml \
    --output infra/talos/generated/nodes/k8s-cp-${i}.yaml
done
```

## Workers

```bash
for i in 01 02 03 04; do
  talosctl machineconfig patch \
    infra/talos/generated/base/worker.yaml \
    --patch @infra/talos/patches/worker-${i}.yaml \
    --output infra/talos/generated/nodes/k8s-worker-${i}.yaml
done
```

Verify:

```bash
ls -lah infra/talos/generated/nodes
```

Expected:

```text
k8s-cp-01.yaml
k8s-cp-02.yaml
k8s-cp-03.yaml
k8s-worker-01.yaml
k8s-worker-02.yaml
k8s-worker-03.yaml
k8s-worker-04.yaml
```

---

# 18. Strictly validate all seven configurations

Do not apply a configuration that does not pass validation.

```bash
for config in infra/talos/generated/nodes/*.yaml; do
  echo
  echo "===== Validating ${config} ====="

  talosctl validate \
    --config "${config}" \
    --mode metal \
    --strict || exit 1
done
```

Expected for every machine:

```text
<file> is valid for metal mode
```

---

# 19. Verify rendered addresses and VIP

```bash
grep -nE \
  'hostname:|address: 10\.42\.0\.|name: 10\.42\.0\.60|link: ens18|gateway: 10\.42\.0\.1' \
  infra/talos/generated/nodes/*.yaml
```

Expected static IP map:

```text
k8s-cp-01       10.42.0.70
k8s-cp-02       10.42.0.71
k8s-cp-03       10.42.0.72

k8s-worker-01   10.42.0.80
k8s-worker-02   10.42.0.81
k8s-worker-03   10.42.0.82
k8s-worker-04   10.42.0.83
```

Only the control-plane configs should contain:

```yaml
kind: Layer2VIPConfig
name: 10.42.0.60
link: ens18
```

---

# 20. Verify the custom installer image rendered

```bash
grep -nA5 \
  'install:' \
  infra/talos/generated/nodes/k8s-cp-01.yaml
```

Expected:

```yaml
install:
  disk: /dev/sda
  image: factory.talos.dev/metal-installer/ce4c980550dd2ab1b17bbf2b08801c7eb59418eafe8f279833297925d67c7515:v1.13.9
```

Repeat if desired:

```bash
grep -HnA4 \
  'install:' \
  infra/talos/generated/nodes/*.yaml
```

---

# 21. Install control plane 1

This writes Talos to `/dev/sda`.

Verify the VM mapping before executing.

```bash
talosctl apply-config \
  --insecure \
  --nodes 10.42.0.24 \
  --file infra/talos/generated/nodes/k8s-cp-01.yaml
```

Expected:

```text
Applied configuration without a reboot
```

The node should transition from:

```text
10.42.0.24
```

to:

```text
10.42.0.70
```

Configure `talosctl`:

```bash
export TALOSCONFIG="$PWD/infra/talos/recovery/talosconfig"

talosctl config endpoint 10.42.0.70
talosctl config node 10.42.0.70
```

Verify:

```bash
talosctl config info
```

Then:

```bash
talosctl version
```

Expected server:

```text
NODE: 10.42.0.70
Tag:  v1.13.9
```

Check the Talos API port if necessary:

```bash
nc -vz 10.42.0.70 50000
```

---

# 22. Install control plane 2

```bash
talosctl apply-config \
  --insecure \
  --nodes 10.42.0.25 \
  --file infra/talos/generated/nodes/k8s-cp-02.yaml
```

Permanent address:

```text
10.42.0.71
```

Verify:

```bash
talosctl version \
  --endpoints 10.42.0.71 \
  --nodes 10.42.0.71
```

---

# 23. Install control plane 3

```bash
talosctl apply-config \
  --insecure \
  --nodes 10.42.0.28 \
  --file infra/talos/generated/nodes/k8s-cp-03.yaml
```

Permanent address:

```text
10.42.0.72
```

Verify:

```bash
talosctl version \
  --endpoints 10.42.0.72 \
  --nodes 10.42.0.72
```

---

# 24. Configure permanent Talos management endpoints

Configure all three control planes as Talos API endpoints:

```bash
talosctl config endpoint \
  10.42.0.70 \
  10.42.0.71 \
  10.42.0.72
```

Keep one default node:

```bash
talosctl config node 10.42.0.70
```

Check:

```bash
talosctl config info
```

Expected:

```text
Nodes:       10.42.0.70
Endpoints:   10.42.0.70, 10.42.0.71, 10.42.0.72
Roles:       os:admin
```

Test all three:

```bash
for ip in 10.42.0.70 10.42.0.71 10.42.0.72; do
  echo "===== $ip ====="

  talosctl version \
    --endpoints "$ip" \
    --nodes "$ip"
done
```

---

# 25. Verify control-plane discovery

Before bootstrapping etcd:

```bash
talosctl get members \
  --nodes 10.42.0.70
```

Expected members:

```text
k8s-cp-01   10.42.0.70
k8s-cp-02   10.42.0.71
k8s-cp-03   10.42.0.72
```

All three should show machine type:

```text
controlplane
```

---

# 26. Bootstrap etcd exactly once

> **STOP AND READ**
>
> This command initializes the etcd cluster.
>
> Run it **one time only** for a new cluster.
>
> Do not run it on every control plane.

Bootstrap using `k8s-cp-01`:

```bash
talosctl bootstrap \
  --nodes 10.42.0.70 \
  --endpoints 10.42.0.70
```

Do not run this command again after it succeeds.

If you later receive:

```text
etcd data directory is not empty
```

the node has already been bootstrapped. Do **not** try to force another bootstrap.

---

# 27. Verify etcd

Check membership:

```bash
talosctl etcd members \
  --nodes 10.42.0.70
```

Expected:

```text
3 members
```

Check status on every control plane:

```bash
talosctl etcd status \
  --nodes 10.42.0.70,10.42.0.71,10.42.0.72
```

Requirements:

```text
3 voting members
LEARNER=false for all three
one elected leader
no errors
```

Check service health:

```bash
talosctl service etcd \
  --nodes 10.42.0.70,10.42.0.71,10.42.0.72
```

Expected for all three:

```text
STATE    Running
HEALTH   OK
```

---

# 28. Verify the Kubernetes API VIP

After etcd bootstraps, Talos should advertise:

```text
10.42.0.60
```

Test:

```bash
ping -c 3 10.42.0.60
```

Then:

```bash
nc -vz 10.42.0.60 6443
```

Expected:

```text
Connection to 10.42.0.60 6443 port succeeded
```

Check Talos membership:

```bash
talosctl get members \
  --nodes 10.42.0.70
```

One control plane should currently advertise the VIP in addition to its own static IP.

The VIP owner may change during control-plane failover.

---

# 29. Retrieve an isolated kubeconfig

Do not automatically merge this cluster into another existing kubeconfig.

Create a dedicated file:

```bash
talosctl kubeconfig \
  infra/talos/recovery/kubeconfig \
  --nodes 10.42.0.70 \
  --force
```

Protect it:

```bash
chmod 600 infra/talos/recovery/kubeconfig
```

Use it in the current shell:

```bash
export KUBECONFIG="$PWD/infra/talos/recovery/kubeconfig"
```

Verify:

```bash
kubectl config current-context
```

Expected:

```text
admin@aerealith-production
```

Verify the Kubernetes API endpoint:

```bash
kubectl config view \
  --minify \
  --raw \
  -o jsonpath='{.clusters[0].cluster.server}{"\n"}'
```

Expected:

```text
https://10.42.0.60:6443
```

---

# 30. Initial Kubernetes state

Before Cilium is installed:

```bash
kubectl get nodes -o wide
```

The control planes may show:

```text
NotReady
```

That is expected because the cluster intentionally has:

```yaml
cluster:
  network:
    cni:
      name: none
```

The Kubernetes API and etcd can be healthy while the nodes remain `NotReady` until a CNI is installed.

---

# 31. Verify kube-proxy

This cluster intentionally keeps kube-proxy.

```bash
kubectl -n kube-system get daemonset kube-proxy
```

Expected before workers join:

```text
DESIRED   3
CURRENT   3
READY     3
```

Check Kubernetes-assigned PodCIDRs:

```bash
kubectl get nodes \
  -o custom-columns='NAME:.metadata.name,INTERNAL-IP:.status.addresses[?(@.type=="InternalIP")].address,POD-CIDR:.spec.podCIDR'
```

The control-plane nodes should have unique `/24` PodCIDRs inside:

```text
10.200.0.0/16
```

---

# 32. Install Cilium

Add the official Helm repository:

```bash
helm repo add cilium https://helm.cilium.io/
helm repo update
```

Verify the pinned version:

```bash
helm search repo cilium/cilium \
  --version 1.20.1
```

Install:

```bash
helm upgrade --install cilium cilium/cilium \
  --version 1.20.1 \
  --namespace kube-system \
  --set ipam.mode=kubernetes \
  --set kubeProxyReplacement=false \
  --set cni.exclusive=false \
  --set routingMode=tunnel \
  --set tunnelProtocol=vxlan \
  --set cgroup.autoMount.enabled=false \
  --set cgroup.hostRoot=/sys/fs/cgroup \
  --set bpf.hostLegacyRouting=true \
  --set operator.replicas=2 \
  --set hubble.relay.enabled=true \
  --set hubble.ui.enabled=false \
  --set securityContext.capabilities.ciliumAgent="{CHOWN,KILL,NET_ADMIN,NET_RAW,IPC_LOCK,SYS_ADMIN,SYS_RESOURCE,DAC_OVERRIDE,FOWNER,SETGID,SETUID}" \
  --set securityContext.capabilities.cleanCiliumState="{NET_ADMIN,SYS_ADMIN,SYS_RESOURCE}"
```

This cluster intentionally uses:

```text
kube-proxy replacement: false
CNI exclusive:          false
Routing:                VXLAN tunnel
IPAM:                   Kubernetes host-scope PodCIDRs
Host routing:           legacy
```

`cni.exclusive=false` is retained because Istio Ambient CNI will be introduced later.

`bpf.hostLegacyRouting=true` is required for the Talos host-DNS behavior used by this configuration.

---

# 33. Wait for Cilium

```bash
kubectl -n kube-system rollout status \
  daemonset/cilium \
  --timeout=5m
```

```bash
kubectl -n kube-system rollout status \
  deployment/cilium-operator \
  --timeout=5m
```

Inspect:

```bash
kubectl -n kube-system get pods -o wide
```

At the three-control-plane stage, Cilium should run on all three nodes.

CoreDNS should also become schedulable and start running.

Hubble Relay may remain `Pending` until workers exist because ordinary workload scheduling is disabled on the control planes.

---

# 34. Validate Cilium

Select a Cilium pod:

```bash
CILIUM_POD="$(
  kubectl -n kube-system get pods \
    -l k8s-app=cilium \
    -o jsonpath='{.items[0].metadata.name}'
)"
```

Check status:

```bash
kubectl -n kube-system exec \
  "$CILIUM_POD" \
  -- cilium-dbg status
```

Important expected values:

```text
Kubernetes:              Ok
KubeProxyReplacement:    False
Cilium:                  Ok
Routing:                 Network: Tunnel [vxlan]
Hubble:                  Ok
Controller Status:       healthy
```

Verify intended configuration:

```bash
kubectl -n kube-system get configmap cilium-config \
  -o yaml |
  grep -E 'kube-proxy-replacement|cni-exclusive|enable-host-legacy-routing'
```

Expected:

```text
cni-exclusive: "false"
enable-host-legacy-routing: "true"
kube-proxy-replacement: "false"
```

---

# 35. Install worker 1

```bash
talosctl apply-config \
  --insecure \
  --nodes 10.42.0.26 \
  --file infra/talos/generated/nodes/k8s-worker-01.yaml
```

Permanent address:

```text
10.42.0.80
```

---

# 36. Install worker 2

```bash
talosctl apply-config \
  --insecure \
  --nodes 10.42.0.29 \
  --file infra/talos/generated/nodes/k8s-worker-02.yaml
```

Permanent address:

```text
10.42.0.81
```

---

# 37. Install worker 3

```bash
talosctl apply-config \
  --insecure \
  --nodes 10.42.0.27 \
  --file infra/talos/generated/nodes/k8s-worker-03.yaml
```

Permanent address:

```text
10.42.0.82
```

---

# 38. Install worker 4

```bash
talosctl apply-config \
  --insecure \
  --nodes 10.42.0.30 \
  --file infra/talos/generated/nodes/k8s-worker-04.yaml
```

Permanent address:

```text
10.42.0.83
```

---

# 39. Verify workers through Talos

```bash
for ip in 10.42.0.80 10.42.0.81 10.42.0.82 10.42.0.83; do
  echo "===== $ip ====="

  talosctl version \
    --endpoints 10.42.0.70 \
    --nodes "$ip"
done
```

The transition from DHCP to static addressing may take a short period.

A temporary:

```text
no route to host
```

while the VM is rebooting or changing addresses is not automatically a failure.

Check machine status:

```bash
talosctl get machinestatus \
  --nodes 10.42.0.80,10.42.0.81,10.42.0.82,10.42.0.83
```

Eventually all four should show:

```text
STAGE     running
READY     true
```

---

# 40. Wait for all seven Kubernetes nodes

```bash
kubectl get nodes -o wide -w
```

Expected final state:

```text
k8s-cp-01       Ready   control-plane
k8s-cp-02       Ready   control-plane
k8s-cp-03       Ready   control-plane

k8s-worker-01   Ready
k8s-worker-02   Ready
k8s-worker-03   Ready
k8s-worker-04   Ready
```

Stop watching with:

```text
Ctrl+C
```

---

# 41. Verify PodCIDRs

```bash
kubectl get nodes \
  -o custom-columns='NAME:.metadata.name,IP:.status.addresses[?(@.type=="InternalIP")].address,POD-CIDR:.spec.podCIDR'
```

A validated allocation from the current cluster was:

```text
k8s-cp-03       10.200.0.0/24
k8s-cp-02       10.200.1.0/24
k8s-cp-01       10.200.2.0/24
k8s-worker-01   10.200.3.0/24
k8s-worker-03   10.200.4.0/24
k8s-worker-02   10.200.5.0/24
k8s-worker-04   10.200.6.0/24
```

The exact order may vary after a complete rebuild.

What matters is:

```text
all are unique
all are inside 10.200.0.0/16
```

---

# 42. Verify Cilium on all seven nodes

```bash
kubectl -n kube-system get daemonsets
```

Expected:

```text
cilium         DESIRED 7   READY 7
cilium-envoy   DESIRED 7   READY 7
kube-proxy     DESIRED 7   READY 7
```

Check pods:

```bash
kubectl -n kube-system get pods -o wide
```

Hubble Relay should now be able to schedule onto a worker:

```text
hubble-relay-...   1/1   Running
```

Check Cilium again:

```bash
CILIUM_POD="$(
  kubectl -n kube-system get pods \
    -l k8s-app=cilium \
    -o jsonpath='{.items[0].metadata.name}'
)"

kubectl -n kube-system exec \
  "$CILIUM_POD" \
  -- cilium-dbg status
```

Expected:

```text
Cluster health: 7/7 reachable
```

---

# 43. Verify control-plane workload isolation

```bash
kubectl get nodes \
  -o custom-columns='NAME:.metadata.name,TAINTS:.spec.taints'
```

Expected:

```text
k8s-cp-01       node-role.kubernetes.io/control-plane:NoSchedule
k8s-cp-02       node-role.kubernetes.io/control-plane:NoSchedule
k8s-cp-03       node-role.kubernetes.io/control-plane:NoSchedule

k8s-worker-01   <none>
k8s-worker-02   <none>
k8s-worker-03   <none>
k8s-worker-04   <none>
```

System components may still contain tolerations allowing them onto control-plane nodes.

Application workloads should not normally run there.

---

# 44. Final Talos health check

```bash
talosctl get machinestatus \
  --nodes \
  10.42.0.70,10.42.0.71,10.42.0.72,10.42.0.80,10.42.0.81,10.42.0.82,10.42.0.83
```

Expected for every node:

```text
STAGE     running
READY     true
```

Check etcd again:

```bash
talosctl etcd status \
  --nodes 10.42.0.70,10.42.0.71,10.42.0.72
```

There must still be exactly three etcd members.

Workers do not join etcd.

---

# 45. Remove/eject the installer ISO

This is mandatory before considering the installation complete.

For **all seven Talos VMs** in Proxmox:

```text
VM
└── Hardware
    └── CD/DVD Drive
        └── Do not use any media
```

Then ensure the system disk is the first enabled boot device.

A Talos node that accidentally boots the installer ISO again may:

- come up on its former DHCP maintenance address,
- appear `NotReady` in Kubernetes,
- allow `talosctl apply-config --insecure` again,
- disappear temporarily from its permanent address.

If this happens, fix the boot order/eject the ISO rather than repeatedly reinstalling the node.

---

# 46. Test worker reboot persistence

Start with a worker:

```bash
talosctl reboot \
  --nodes 10.42.0.83
```

Watch Kubernetes:

```bash
watch -n 2 'kubectl get nodes -o wide'
```

The worker should temporarily become unavailable, then return:

```text
k8s-worker-04   Ready
```

Verify Talos:

```bash
talosctl get machinestatus \
  --nodes 10.42.0.83
```

Expected:

```text
STAGE     running
READY     true
```

---

# 47. Test control-plane HA

Confirm etcd is healthy first:

```bash
talosctl etcd status \
  --nodes 10.42.0.70,10.42.0.71,10.42.0.72
```

Reboot one control plane:

```bash
talosctl reboot \
  --nodes 10.42.0.70
```

While it reboots, verify the Kubernetes VIP remains available:

```bash
for i in {1..20}; do
  nc -zvw1 10.42.0.60 6443
  sleep 1
done
```

Watch Kubernetes:

```bash
watch -n 2 'kubectl get nodes -o wide'
```

When `k8s-cp-01` returns, all seven nodes should again show:

```text
Ready
```

Recheck etcd:

```bash
talosctl etcd status \
  --nodes 10.42.0.70,10.42.0.71,10.42.0.72
```

A healthy cluster should retain quorum while a single control plane is unavailable.

---

# 48. Optional Cilium connectivity test

If the Cilium CLI is installed:

```bash
cilium status --wait
```

Then:

```bash
cilium connectivity test
```

This exercises pod-to-pod, service, DNS, policy, and other network paths.

If using temporary connectivity-test workloads, remove them after validation.

---

# 49. Security notes

This document only covers the Talos/Kubernetes foundation.

The production Aerealith platform still adds additional controls after this stage, including:

```text
FluxCD
Istio Ambient
Kyverno
cert-manager
OpenBao
Flagger
Prometheus / Alertmanager
Grafana
OpenTelemetry
Loki
Falco
supply-chain scanning and signing
default-deny workload network policy
Cloudflare Tunnel ingress
backup and disaster-recovery controls
```

Do not expose these management surfaces directly to the Internet:

```text
Talos API       TCP/50000
Kubernetes API  TCP/6443
Proxmox
OpenBao
Grafana
Prometheus
etcd
SSH
NodePorts
```

The Kubernetes API VIP:

```text
10.42.0.60
```

is private to the LAN/admin plane.

Public applications should later enter through the controlled ingress path, not through direct Kubernetes node exposure.

---

# 50. Hubble Relay TLS

The initial Cilium bootstrap enables Hubble Relay but does not enable TLS on the Relay server endpoint.

That is acceptable only as a temporary bootstrap condition on the trusted internal network.

The production configuration should enable Hubble Relay TLS, preferably with certificate lifecycle managed by `cert-manager`.

Do not expose an unencrypted Hubble Relay endpoint outside the cluster/trusted administration network.

---

# 51. DNS

This runbook intentionally does not hardcode a LAN DNS resolver because a final internal resolver address has not yet been designated.

Before production hardening, explicitly decide the cluster/node DNS architecture and update Talos resolver configuration if required.

Do not invent or silently assign a resolver IP.

---

# 52. Common troubleshooting

## `failed to determine endpoints`

Example:

```text
error constructing client: failed to determine endpoints
```

Set the Talos endpoints:

```bash
export TALOSCONFIG="$PWD/infra/talos/recovery/talosconfig"

talosctl config endpoint \
  10.42.0.70 \
  10.42.0.71 \
  10.42.0.72

talosctl config node 10.42.0.70
```

Verify:

```bash
talosctl config info
```

---

## Static IP does not answer immediately

After:

```bash
talosctl apply-config --insecure ...
```

the node may be changing from its DHCP address to its static address.

Check:

```bash
ping -c 3 <STATIC_IP>
nc -vz <STATIC_IP> 50000
```

If the old maintenance address stops responding, that is expected once the static configuration takes over.

---

## `no route to host`

Example:

```text
dial tcp 10.42.0.81:50000: connect: no route to host
```

First wait briefly and retry:

```bash
nc -vz 10.42.0.81 50000
```

Then inspect the VM console in Proxmox.

Confirm:

```text
VM is powered on
ens18 exists
static address is correct
Talos did not boot back into installer maintenance mode
```

---

## Node comes back on its old DHCP address

This strongly indicates the VM booted the Talos installer ISO again.

Fix Proxmox boot order:

```text
system disk first
ISO disabled/ejected
```

Then reboot.

Do not repeatedly re-run `apply-config` against the maintenance address as a substitute for fixing the boot device.

---

## `etcd data directory is not empty`

Example:

```text
rpc error: code = AlreadyExists desc = etcd data directory is not empty
```

The cluster has already been bootstrapped.

Do not run:

```bash
talosctl bootstrap
```

again.

Verify instead:

```bash
talosctl etcd members \
  --nodes 10.42.0.70
```

and:

```bash
talosctl etcd status \
  --nodes 10.42.0.70,10.42.0.71,10.42.0.72
```

---

## Nodes are `NotReady` before Cilium

Expected.

The generated Talos configuration deliberately disables the default CNI:

```yaml
cluster:
  network:
    cni:
      name: none
```

Install Cilium.

---

## Hubble Relay is `Pending`

If only the control planes exist and they are protected with `NoSchedule`, Hubble Relay may remain pending.

After workers join, Kubernetes should schedule Hubble Relay onto a worker.

Verify:

```bash
kubectl -n kube-system get pods -o wide
```

---

## Control plane temporarily becomes `NotReady`

Check the Talos machine first:

```bash
talosctl get machinestatus \
  --nodes 10.42.0.70
```

Check Cilium:

```bash
kubectl -n kube-system get pods \
  -o wide |
  grep k8s-cp-01
```

Check static pods:

```bash
kubectl -n kube-system get pods \
  -o wide |
  grep k8s-cp-01
```

Check etcd:

```bash
talosctl etcd status \
  --nodes 10.42.0.70,10.42.0.71,10.42.0.72
```

Also confirm the VM did not boot the installer ISO.

---

# 53. Full bootstrap command checklist

The condensed sequence below assumes all patch files already exist and every VM is in Talos maintenance mode at the listed DHCP addresses.

## Prepare

```bash
cd /mnt/disk-sdc/Projects/Aerealith

mkdir -p \
  infra/talos/generated/base \
  infra/talos/generated/nodes \
  infra/talos/recovery

chmod 700 infra/talos/recovery
umask 077
```

## Create secrets — new cluster only

```bash
test ! -e infra/talos/recovery/secrets.yaml || {
  echo "ERROR: cluster secrets already exist; refusing to overwrite."
  exit 1
}

talosctl gen secrets \
  --output-file infra/talos/recovery/secrets.yaml

chmod 600 infra/talos/recovery/secrets.yaml
```

## Generate configs

```bash
talosctl gen config \
  aerealith-production \
  https://10.42.0.60:6443 \
  --with-secrets infra/talos/recovery/secrets.yaml \
  --config-patch @infra/talos/patches/common.yaml \
  --additional-sans 10.42.0.60 \
  --output-dir infra/talos/generated/base \
  --with-docs=false \
  --with-examples=false
```

## Preserve talosconfig

```bash
cp \
  infra/talos/generated/base/talosconfig \
  infra/talos/recovery/talosconfig

chmod 600 infra/talos/recovery/talosconfig

export TALOSCONFIG="$PWD/infra/talos/recovery/talosconfig"
```

## Render node configs

```bash
for i in 01 02 03; do
  talosctl machineconfig patch \
    infra/talos/generated/base/controlplane.yaml \
    --patch @infra/talos/patches/cp-${i}.yaml \
    --output infra/talos/generated/nodes/k8s-cp-${i}.yaml
done

for i in 01 02 03 04; do
  talosctl machineconfig patch \
    infra/talos/generated/base/worker.yaml \
    --patch @infra/talos/patches/worker-${i}.yaml \
    --output infra/talos/generated/nodes/k8s-worker-${i}.yaml
done
```

## Validate

```bash
for config in infra/talos/generated/nodes/*.yaml; do
  echo "===== Validating ${config} ====="

  talosctl validate \
    --config "${config}" \
    --mode metal \
    --strict || exit 1
done
```

## Install control planes

```bash
talosctl apply-config \
  --insecure \
  --nodes 10.42.0.24 \
  --file infra/talos/generated/nodes/k8s-cp-01.yaml

talosctl apply-config \
  --insecure \
  --nodes 10.42.0.25 \
  --file infra/talos/generated/nodes/k8s-cp-02.yaml

talosctl apply-config \
  --insecure \
  --nodes 10.42.0.28 \
  --file infra/talos/generated/nodes/k8s-cp-03.yaml
```

## Configure Talos endpoints

```bash
talosctl config endpoint \
  10.42.0.70 \
  10.42.0.71 \
  10.42.0.72

talosctl config node 10.42.0.70
```

## Verify all three control planes

```bash
for ip in 10.42.0.70 10.42.0.71 10.42.0.72; do
  talosctl version \
    --endpoints "$ip" \
    --nodes "$ip"
done
```

## Confirm membership

```bash
talosctl get members \
  --nodes 10.42.0.70
```

## Bootstrap exactly once

```bash
talosctl bootstrap \
  --nodes 10.42.0.70 \
  --endpoints 10.42.0.70
```

## Verify etcd

```bash
talosctl etcd members \
  --nodes 10.42.0.70

talosctl etcd status \
  --nodes 10.42.0.70,10.42.0.71,10.42.0.72
```

## Verify Kubernetes VIP

```bash
ping -c 3 10.42.0.60
nc -vz 10.42.0.60 6443
```

## Retrieve kubeconfig

```bash
talosctl kubeconfig \
  infra/talos/recovery/kubeconfig \
  --nodes 10.42.0.70 \
  --force

chmod 600 infra/talos/recovery/kubeconfig

export KUBECONFIG="$PWD/infra/talos/recovery/kubeconfig"
```

## Install Cilium

```bash
helm repo add cilium https://helm.cilium.io/
helm repo update

helm upgrade --install cilium cilium/cilium \
  --version 1.20.1 \
  --namespace kube-system \
  --set ipam.mode=kubernetes \
  --set kubeProxyReplacement=false \
  --set cni.exclusive=false \
  --set routingMode=tunnel \
  --set tunnelProtocol=vxlan \
  --set cgroup.autoMount.enabled=false \
  --set cgroup.hostRoot=/sys/fs/cgroup \
  --set bpf.hostLegacyRouting=true \
  --set operator.replicas=2 \
  --set hubble.relay.enabled=true \
  --set hubble.ui.enabled=false \
  --set securityContext.capabilities.ciliumAgent="{CHOWN,KILL,NET_ADMIN,NET_RAW,IPC_LOCK,SYS_ADMIN,SYS_RESOURCE,DAC_OVERRIDE,FOWNER,SETGID,SETUID}" \
  --set securityContext.capabilities.cleanCiliumState="{NET_ADMIN,SYS_ADMIN,SYS_RESOURCE}"
```

## Wait for Cilium

```bash
kubectl -n kube-system rollout status \
  daemonset/cilium \
  --timeout=5m

kubectl -n kube-system rollout status \
  deployment/cilium-operator \
  --timeout=5m
```

## Install workers

```bash
talosctl apply-config \
  --insecure \
  --nodes 10.42.0.26 \
  --file infra/talos/generated/nodes/k8s-worker-01.yaml

talosctl apply-config \
  --insecure \
  --nodes 10.42.0.29 \
  --file infra/talos/generated/nodes/k8s-worker-02.yaml

talosctl apply-config \
  --insecure \
  --nodes 10.42.0.27 \
  --file infra/talos/generated/nodes/k8s-worker-03.yaml

talosctl apply-config \
  --insecure \
  --nodes 10.42.0.30 \
  --file infra/talos/generated/nodes/k8s-worker-04.yaml
```

## Verify cluster

```bash
kubectl get nodes -o wide

talosctl get machinestatus \
  --nodes \
  10.42.0.70,10.42.0.71,10.42.0.72,10.42.0.80,10.42.0.81,10.42.0.82,10.42.0.83
```

## Verify Cilium

```bash
CILIUM_POD="$(
  kubectl -n kube-system get pods \
    -l k8s-app=cilium \
    -o jsonpath='{.items[0].metadata.name}'
)"

kubectl -n kube-system exec \
  "$CILIUM_POD" \
  -- cilium-dbg status
```

Expected:

```text
Cluster health: 7/7 reachable
```

---

# 54. Successful foundation state

The Talos/Kubernetes VM bootstrap is complete when all of the following are true:

```text
[ ] 3 Talos control-plane VMs are on separate physical Proxmox hosts
[ ] 4 Talos worker VMs are online
[ ] all nodes run Talos v1.13.9
[ ] all nodes use permanent 10.42.0.x addresses
[ ] Kubernetes API VIP 10.42.0.60:6443 is reachable
[ ] etcd contains exactly 3 healthy voting members
[ ] Kubernetes reports 7/7 nodes Ready
[ ] all control planes have NoSchedule taints
[ ] workers have no control-plane taint
[ ] all nodes have unique PodCIDRs from 10.200.0.0/16
[ ] Cilium 1.20.1 is healthy
[ ] Cilium reports 7/7 reachable
[ ] kube-proxy remains enabled
[ ] Hubble is healthy
[ ] Hubble Relay is running on a worker
[ ] Talos installer ISO has been ejected/disabled on every VM
[ ] at least one worker reboot test succeeds
[ ] at least one control-plane reboot/failover test succeeds
[ ] secrets.yaml is backed up securely
[ ] talosconfig is backed up securely
[ ] kubeconfig is protected and not committed
```

At this point, stop manually building the platform one Helm command at a time.

The next phase should establish **FluxCD GitOps ownership**, after which platform components such as Istio, Kyverno, cert-manager, Flagger, OpenBao integration, observability, and security tooling should be declared and reconciled from Git.

---

# 55. References

Official Talos Proxmox guide:

https://docs.siderolabs.com/talos/v1.13/platform-specific-installations/virtualized-platforms/proxmox

Talos CLI reference:

https://docs.siderolabs.com/talos/v1.13/reference/cli

Talos Image Factory:

https://docs.siderolabs.com/talos/v1.13/learn-more/image-factory

Cilium Helm installation:

https://docs.cilium.io/en/stable/installation/k8s-install-helm/

Cilium documentation:

https://docs.cilium.io/
