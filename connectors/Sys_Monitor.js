const { z } = require("zod");
const { execSync } = require("child_process");
const utilities = require("../utilities");

const run = (cmd, host) => {
    try {
        const fullCmd = host ? `ssh ${host} '${cmd}'` : cmd;
        return execSync(fullCmd, { timeout: 10000 }).toString().trim();
    } catch (e) {
        return `Error: ${e.message}`;
    }
};

const handler = async ({ action, host }) => {
    let output;
    switch (action) {
        case "overview":
            output = {
                hostname: run("hostname", host),
                uptime: run("uptime -p", host),
                kernel: run("uname -r", host),
                inxi: run("inxi -F --tty", host),
                load: run("cat /proc/loadavg", host),
                cpu_temp: run("sensors -j 2>/dev/null || echo '{}'", host),
                memory: run("free -h --si", host),
                swap: run("swapon --show", host),
                disk: run("df -h --total -x tmpfs -x devtmpfs", host),
                users: run("who", host)
            };
            break;
        case "cpu":
            output = {
                model: run("lscpu | grep 'Model name'", host),
                cores: run("nproc", host),
                load: run("cat /proc/loadavg", host),
                temp: run("sensors -j 2>/dev/null || echo '{}'", host),
                freq: run("lscpu | grep 'MHz'", host)
            };
            break;
        case "memory":
            output = {
                ram: run("free -h --si", host),
                swap: run("swapon --show", host),
                top_mem: run("ps aux --sort=-%mem | head -11", host)
            };
            break;
        case "disk":
            output = {
                usage: run("df -h --total -x tmpfs -x devtmpfs", host),
                io: run("iostat -h 2>/dev/null || echo 'iostat not installed'", host),
                smart: run("sudo smartctl -H /dev/nvme0n1 2>/dev/null || echo 'smartctl not available'", host)
            };
            break;
        case "network":
            output = {
                interfaces: run("ip -brief addr", host),
                connections: run("ss -tulnp", host),
                dns: run("resolvectl status 2>/dev/null || cat /etc/resolv.conf", host),
                tailscale: run("tailscale status 2>/dev/null || echo 'tailscale not running'", host)
            };
            break;
        case "processes":
            output = {
                top_cpu: run("ps aux --sort=-%cpu | head -11", host),
                top_mem: run("ps aux --sort=-%mem | head -11", host),
                count: run("echo $(ps aux | wc -l) processes", host),
                zombies: run("ps aux | grep -c Z || echo 0", host)
            };
            break;
        case "docker":
            output = {
                containers: run("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || echo 'docker not available'", host),
                images: run("docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}' 2>/dev/null || echo 'docker not available'", host)
            };
            break;
        case "gpu":
            output = {
                nvidia: run("nvidia-smi --query-gpu=name,temperature.gpu,utilization.gpu,memory.used,memory.total --format=csv,noheader 2>/dev/null || echo 'nvidia-smi not available'", host),
                intel: run("cat /sys/class/drm/card*/gt_cur_freq_mhz 2>/dev/null || echo 'no intel gpu info'", host)
            };
            break;
    }

    return utilities.sendify(output);
};

module.exports = {
    identifier: "system_monitor",
    handler,
    params: {
        action: z.enum(["overview", "cpu", "memory", "disk", "network", "processes", "docker", "gpu"]).describe("What to check"),
        host: z.string().optional().describe("SSH host to run on (e.g. user@hostname or a ~/.ssh/config alias). Leave blank for local machine")
    }
};
