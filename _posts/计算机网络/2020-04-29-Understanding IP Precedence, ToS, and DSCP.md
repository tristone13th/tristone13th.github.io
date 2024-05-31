---
categories: 计算机网络
title: Understanding IP Precedence, ToS, and DSCP
---

# Type of Service (ToS)

The ToS field, originally defined in RFC 791, is present in the **IP header**.

The ToS octet consists of three fields. The last 3 bits (7, 6, 5) are for the first field, labeled “Precedence,” intended to denote the importance or priority of the datagram. The second field, labeled “TOS,” denotes how the network should make tradeoffs between throughput, delay, reliability, and cost. The first field, labeled “MBZ” (for “must be zero”) above, is currently unused. The originator of a datagram sets this field to zero (unless participating in an Internet protocol experiment which makes use of that bit). Routers and recipients of datagrams ignore the value of this field. This field is copied on fragmentation.

```c++
/**
	* The usage of the TOS byte has been originally defined by
    * RFC 1349 (http://www.ietf.org/rfc/rfc1349.txt):
    *
    *               0     1     2     3     4     5     6     7
    *           +-----+-----+-----+-----+-----+-----+-----+-----+
    *           |   PRECEDENCE    |          TOS          | MBZ |
    *           +-----+-----+-----+-----+-----+-----+-----+-----+
    *
    * where MBZ stands for 'must be zero'.
    */
```

# Differentiated Services Code Point (DSCP)

The definition of ToS was changed entirely in RFC 2474, and it is now called Differentiated Service (DS). On the eight fields, the upper six bit contain value called Differentiated Services Code Point (DSCP). The last two bits are used for Explicit Congestion Notification and it is defined in RFC 3168.

```c++
/**
   * RFC 2474 (http://www.ietf.org/rfc/rfc2474.txt) redefines the TOS byte:
   *
   *               0     1     2     3     4     5     6     7
   *           +-----+-----+-----+-----+-----+-----+-----+-----+
   *           |              DSCP                 |     CU    |
   *           +-----+-----+-----+-----+-----+-----+-----+-----+
   *
   * where DSCP is the Differentiated Services Code Point and CU stands for
   * 'currently unused' (actually, RFC 3168 proposes to use these two bits for
   * ECN purposes).
   */
```

# Reference

- [Understanding IP Precedence, ToS, and DSCP - ManageEngine Blog](https://blogs.manageengine.com/network/netflowanalyzer/2012/04/24/understanding-ip-precedence-tos-dscp.html)
- [ns-3: ns3::Socket Class Reference](https://www.nsnam.org/doxygen/classns3_1_1_socket.html)