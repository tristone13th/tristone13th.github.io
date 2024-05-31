---
categories: NS3
title: NS3中的UdpL4Protocol类
---

这个类继承于`IpL4Protocol`类。

这个类保有以下几个私有变量。

```c++
Ptr<Node> m_node; //!< the node this stack is associated with
Ipv4EndPointDemux *m_endPoints; //!< A list of IPv4 end points.
Ipv6EndPointDemux *m_endPoints6; //!< A list of IPv6 end points.

/**
   * \brief Copy constructor
   *
   * Defined and not implemented to avoid misuse
   */
UdpL4Protocol (const UdpL4Protocol &);
/**
   * \brief Copy constructor
   *
   * Defined and not implemented to avoid misuse
   * \returns
   */
UdpL4Protocol &operator = (const UdpL4Protocol &);

std::vector<Ptr<UdpSocketImpl> > m_sockets;      //!< list of sockets
IpL4Protocol::DownTargetCallback m_downTarget;   //!< Callback to send packets over IPv4
IpL4Protocol::DownTargetCallback6 m_downTarget6; //!< Callback to send packets over IPv6
```

我们可以注意到，这个类中**并没有保有设备信息，这说明这是设备无关的**，但是这是节点相关的，也就是其需要保有一个和主机相关的主机号。

`Ipv4EndPointDemux`类是一个连接的集合。这个类保有这个变量并不奇怪，因为一台主机可以同时有多个连接。m_sockets中保有了所有socket的集合，而m_downTarget设置了当需要发送包时，应当如何执行动作。

下面可以看一下这个类中定义并实现了哪些函数：

```c++
namespace ns3 {

NS_LOG_COMPONENT_DEFINE ("UdpL4Protocol");

NS_OBJECT_ENSURE_REGISTERED (UdpL4Protocol);

/* see http://www.iana.org/assignments/protocol-numbers */
const uint8_t UdpL4Protocol::PROT_NUMBER = 17;

TypeId 
UdpL4Protocol::GetTypeId (void)
{
  static TypeId tid = TypeId ("ns3::UdpL4Protocol")
    .SetParent<IpL4Protocol> ()
    .SetGroupName ("Internet")
    .AddConstructor<UdpL4Protocol> ()
    .AddAttribute ("SocketList", "The list of sockets associated to this protocol.",
                   ObjectVectorValue (),
                   MakeObjectVectorAccessor (&UdpL4Protocol::m_sockets),
                   MakeObjectVectorChecker<UdpSocketImpl> ())
  ;
  return tid;
}

UdpL4Protocol::UdpL4Protocol ()
  : m_endPoints (new Ipv4EndPointDemux ()), m_endPoints6 (new Ipv6EndPointDemux ())
{
  NS_LOG_FUNCTION_NOARGS ();
}

UdpL4Protocol::~UdpL4Protocol ()
{
  NS_LOG_FUNCTION_NOARGS ();
}

void 
UdpL4Protocol::SetNode (Ptr<Node> node)
{
  m_node = node;
}

/*
 * This method is called by AddAgregate and completes the aggregation
 * by setting the node in the udp stack and link it to the ipv4 object
 * present in the node along with the socket factory
 */
void
UdpL4Protocol::NotifyNewAggregate ()
{
  NS_LOG_FUNCTION (this);
  Ptr<Node> node = this->GetObject<Node> ();
  Ptr<Ipv4> ipv4 = this->GetObject<Ipv4> ();
  Ptr<Ipv6> ipv6 = node->GetObject<Ipv6> ();

  if (m_node == 0)
    {
      if ((node != 0) && (ipv4 != 0 || ipv6 != 0))
        {
          this->SetNode (node);
          Ptr<UdpSocketFactoryImpl> udpFactory = CreateObject<UdpSocketFactoryImpl> ();
          udpFactory->SetUdp (this);
          node->AggregateObject (udpFactory);
        }
    }
  
  // We set at least one of our 2 down targets to the IPv4/IPv6 send
  // functions.  Since these functions have different prototypes, we
  // need to keep track of whether we are connected to an IPv4 or
  // IPv6 lower layer and call the appropriate one.
  
  if (ipv4 != 0 && m_downTarget.IsNull())
    {
      ipv4->Insert (this);
      this->SetDownTarget (MakeCallback (&Ipv4::Send, ipv4));
    }
  if (ipv6 != 0 && m_downTarget6.IsNull())
    {
      ipv6->Insert (this);
      this->SetDownTarget6 (MakeCallback (&Ipv6::Send, ipv6));
    }
  IpL4Protocol::NotifyNewAggregate ();
}

int 
UdpL4Protocol::GetProtocolNumber (void) const
{
  return PROT_NUMBER;
}


void
UdpL4Protocol::DoDispose (void)
{
  NS_LOG_FUNCTION_NOARGS ();
  for (std::vector<Ptr<UdpSocketImpl> >::iterator i = m_sockets.begin (); i != m_sockets.end (); i++)
    {
      *i = 0;
    }
  m_sockets.clear ();

  if (m_endPoints != 0)
    {
      delete m_endPoints;
      m_endPoints = 0;
    }
  if (m_endPoints6 != 0)
    {
      delete m_endPoints6;
      m_endPoints6 = 0;
    }
  m_node = 0;
  m_downTarget.Nullify ();
  m_downTarget6.Nullify ();
/*
 = MakeNullCallback<void,Ptr<Packet>, Ipv4Address, Ipv4Address, uint8_t, Ptr<Ipv4Route> > ();
*/
  IpL4Protocol::DoDispose ();
}

Ptr<Socket>
UdpL4Protocol::CreateSocket (void)
{
  NS_LOG_FUNCTION_NOARGS ();
  Ptr<UdpSocketImpl> socket = CreateObject<UdpSocketImpl> ();
  socket->SetNode (m_node);
  socket->SetUdp (this);
  m_sockets.push_back (socket);
  return socket;
}

Ipv4EndPoint *
UdpL4Protocol::Allocate (void)
{
  NS_LOG_FUNCTION (this);
  return m_endPoints->Allocate ();
}

Ipv4EndPoint *
UdpL4Protocol::Allocate (Ipv4Address address)
{
  NS_LOG_FUNCTION (this << address);
  return m_endPoints->Allocate (address);
}

Ipv4EndPoint *
UdpL4Protocol::Allocate (Ptr<NetDevice> boundNetDevice, uint16_t port)
{
  NS_LOG_FUNCTION (this << boundNetDevice << port);
  return m_endPoints->Allocate (boundNetDevice, port);
}

Ipv4EndPoint *
UdpL4Protocol::Allocate (Ptr<NetDevice> boundNetDevice, Ipv4Address address, uint16_t port)
{
  NS_LOG_FUNCTION (this << boundNetDevice << address << port);
  return m_endPoints->Allocate (boundNetDevice, address, port);
}
Ipv4EndPoint *
UdpL4Protocol::Allocate (Ptr<NetDevice> boundNetDevice,
                         Ipv4Address localAddress, uint16_t localPort,
                         Ipv4Address peerAddress, uint16_t peerPort)
{
  NS_LOG_FUNCTION (this << boundNetDevice << localAddress << localPort << peerAddress << peerPort);
  return m_endPoints->Allocate (boundNetDevice,
                                localAddress, localPort,
                                peerAddress, peerPort);
}

void 
UdpL4Protocol::DeAllocate (Ipv4EndPoint *endPoint)
{
  NS_LOG_FUNCTION (this << endPoint);
  m_endPoints->DeAllocate (endPoint);
}

Ipv6EndPoint *
UdpL4Protocol::Allocate6 (void)
{
  NS_LOG_FUNCTION (this);
  return m_endPoints6->Allocate ();
}

Ipv6EndPoint *
UdpL4Protocol::Allocate6 (Ipv6Address address)
{
  NS_LOG_FUNCTION (this << address);
  return m_endPoints6->Allocate (address);
}

Ipv6EndPoint *
UdpL4Protocol::Allocate6 (Ptr<NetDevice> boundNetDevice, uint16_t port)
{
  NS_LOG_FUNCTION (this << boundNetDevice << port);
  return m_endPoints6->Allocate (boundNetDevice, port);
}

Ipv6EndPoint *
UdpL4Protocol::Allocate6 (Ptr<NetDevice> boundNetDevice, Ipv6Address address, uint16_t port)
{
  NS_LOG_FUNCTION (this << boundNetDevice << address << port);
  return m_endPoints6->Allocate (boundNetDevice, address, port);
}
Ipv6EndPoint *
UdpL4Protocol::Allocate6 (Ptr<NetDevice> boundNetDevice,
                          Ipv6Address localAddress, uint16_t localPort,
                          Ipv6Address peerAddress, uint16_t peerPort)
{
  NS_LOG_FUNCTION (this << boundNetDevice << localAddress << localPort << peerAddress << peerPort);
  return m_endPoints6->Allocate (boundNetDevice,
                                 localAddress, localPort,
                                 peerAddress, peerPort);
}

void 
UdpL4Protocol::DeAllocate (Ipv6EndPoint *endPoint)
{
  NS_LOG_FUNCTION (this << endPoint);
  m_endPoints6->DeAllocate (endPoint);
}

void 
UdpL4Protocol::ReceiveIcmp (Ipv4Address icmpSource, uint8_t icmpTtl,
                            uint8_t icmpType, uint8_t icmpCode, uint32_t icmpInfo,
                            Ipv4Address payloadSource,Ipv4Address payloadDestination,
                            const uint8_t payload[8])
{
  NS_LOG_FUNCTION (this << icmpSource << icmpTtl << icmpType << icmpCode << icmpInfo 
                        << payloadSource << payloadDestination);
  uint16_t src, dst;
  src = payload[0] << 8;
  src |= payload[1];
  dst = payload[2] << 8;
  dst |= payload[3];

  Ipv4EndPoint *endPoint = m_endPoints->SimpleLookup (payloadSource, src, payloadDestination, dst);
  if (endPoint != 0)
    {
      endPoint->ForwardIcmp (icmpSource, icmpTtl, icmpType, icmpCode, icmpInfo);
    }
  else
    {
      NS_LOG_DEBUG ("no endpoint found source=" << payloadSource <<
                    ", destination="<<payloadDestination<<
                    ", src=" << src << ", dst=" << dst);
    }
}

void 
UdpL4Protocol::ReceiveIcmp (Ipv6Address icmpSource, uint8_t icmpTtl,
                            uint8_t icmpType, uint8_t icmpCode, uint32_t icmpInfo,
                            Ipv6Address payloadSource,Ipv6Address payloadDestination,
                            const uint8_t payload[8])
{
  NS_LOG_FUNCTION (this << icmpSource << icmpTtl << icmpType << icmpCode << icmpInfo 
                        << payloadSource << payloadDestination);
  uint16_t src, dst;
  src = payload[0] << 8;
  src |= payload[1];
  dst = payload[2] << 8;
  dst |= payload[3];

  Ipv6EndPoint *endPoint = m_endPoints6->SimpleLookup (payloadSource, src, payloadDestination, dst);
  if (endPoint != 0)
    {
      endPoint->ForwardIcmp (icmpSource, icmpTtl, icmpType, icmpCode, icmpInfo);
    }
  else
    {
      NS_LOG_DEBUG ("no endpoint found source=" << payloadSource <<
                    ", destination="<<payloadDestination<<
                    ", src=" << src << ", dst=" << dst);
    }
}

enum IpL4Protocol::RxStatus
UdpL4Protocol::Receive (Ptr<Packet> packet,
                        Ipv4Header const &header,
                        Ptr<Ipv4Interface> interface)
{
  NS_LOG_FUNCTION (this << packet << header);
  UdpHeader udpHeader;
  if(Node::ChecksumEnabled ())
    {
      udpHeader.EnableChecksums ();
    }

  udpHeader.InitializeChecksum (header.GetSource (), header.GetDestination (), PROT_NUMBER);

  // We only peek at the header for now (instead of removing it) so that it will be intact
  // if we have to pass it to a IPv6 endpoint via:
  // 
  //   UdpL4Protocol::Receive (Ptr<Packet> packet, Ipv6Address &src, Ipv6Address &dst, ...)

  packet->PeekHeader (udpHeader);

  if(!udpHeader.IsChecksumOk ())
    {
      NS_LOG_INFO ("Bad checksum : dropping packet!");
      return IpL4Protocol::RX_CSUM_FAILED;
    }

  NS_LOG_DEBUG ("Looking up dst " << header.GetDestination () << " port " << udpHeader.GetDestinationPort ()); 
  Ipv4EndPointDemux::EndPoints endPoints =
    m_endPoints->Lookup (header.GetDestination (), udpHeader.GetDestinationPort (),
                         header.GetSource (), udpHeader.GetSourcePort (), interface);
  if (endPoints.empty ())
    {
      if (this->GetObject<Ipv6L3Protocol> () != 0)
        {
          NS_LOG_LOGIC ("  No Ipv4 endpoints matched on UdpL4Protocol, trying Ipv6 "<<this);
          Ptr<Ipv6Interface> fakeInterface;
          Ipv6Header ipv6Header;
          Ipv6Address src = Ipv6Address::MakeIpv4MappedAddress (header.GetSource ());
          Ipv6Address dst = Ipv6Address::MakeIpv4MappedAddress (header.GetDestination ());
          ipv6Header.SetSourceAddress (src);
          ipv6Header.SetDestinationAddress (dst);
          return (this->Receive (packet, ipv6Header, fakeInterface));
        }

      NS_LOG_LOGIC ("RX_ENDPOINT_UNREACH");
      return IpL4Protocol::RX_ENDPOINT_UNREACH;
    }

  packet->RemoveHeader(udpHeader);
  for (Ipv4EndPointDemux::EndPointsI endPoint = endPoints.begin ();
       endPoint != endPoints.end (); endPoint++)
    {
      (*endPoint)->ForwardUp (packet->Copy (), header, udpHeader.GetSourcePort (), 
                              interface);
    }
  return IpL4Protocol::RX_OK;
}

enum IpL4Protocol::RxStatus
UdpL4Protocol::Receive (Ptr<Packet> packet,
                        Ipv6Header const &header,
                        Ptr<Ipv6Interface> interface)
{
  NS_LOG_FUNCTION (this << packet << header.GetSourceAddress () << header.GetDestinationAddress ());
  UdpHeader udpHeader;
  if(Node::ChecksumEnabled ())
    {
      udpHeader.EnableChecksums ();
    }

  udpHeader.InitializeChecksum (header.GetSourceAddress (), header.GetDestinationAddress (), PROT_NUMBER);

  packet->RemoveHeader (udpHeader);

  if(!udpHeader.IsChecksumOk () && !header.GetSourceAddress ().IsIpv4MappedAddress ())
    {
      NS_LOG_INFO ("Bad checksum : dropping packet!");
      return IpL4Protocol::RX_CSUM_FAILED;
    }

  NS_LOG_DEBUG ("Looking up dst " << header.GetDestinationAddress () << " port " << udpHeader.GetDestinationPort ()); 
  Ipv6EndPointDemux::EndPoints endPoints =
    m_endPoints6->Lookup (header.GetDestinationAddress (), udpHeader.GetDestinationPort (),
                         header.GetSourceAddress (), udpHeader.GetSourcePort (), interface);
  if (endPoints.empty ())
    {
      NS_LOG_LOGIC ("RX_ENDPOINT_UNREACH");
      return IpL4Protocol::RX_ENDPOINT_UNREACH;
    }
  for (Ipv6EndPointDemux::EndPointsI endPoint = endPoints.begin ();
       endPoint != endPoints.end (); endPoint++)
    {
      (*endPoint)->ForwardUp (packet->Copy (), header, udpHeader.GetSourcePort (), interface);
    }
  return IpL4Protocol::RX_OK;
}

void
UdpL4Protocol::Send (Ptr<Packet> packet, 
                     Ipv4Address saddr, Ipv4Address daddr, 
                     uint16_t sport, uint16_t dport)
{
  NS_LOG_FUNCTION (this << packet << saddr << daddr << sport << dport);

  UdpHeader udpHeader;
  if(Node::ChecksumEnabled ())
    {
      udpHeader.EnableChecksums ();
      udpHeader.InitializeChecksum (saddr,
                                    daddr,
                                    PROT_NUMBER);
    }
  udpHeader.SetDestinationPort (dport);
  udpHeader.SetSourcePort (sport);

  packet->AddHeader (udpHeader);

  m_downTarget (packet, saddr, daddr, PROT_NUMBER, 0);
}

void
UdpL4Protocol::Send (Ptr<Packet> packet, 
                     Ipv4Address saddr, Ipv4Address daddr, 
                     uint16_t sport, uint16_t dport, Ptr<Ipv4Route> route)
{
  NS_LOG_FUNCTION (this << packet << saddr << daddr << sport << dport << route);

  UdpHeader udpHeader;
  if(Node::ChecksumEnabled ())
    {
      udpHeader.EnableChecksums ();
      udpHeader.InitializeChecksum (saddr,
                                    daddr,
                                    PROT_NUMBER);
    }
  udpHeader.SetDestinationPort (dport);
  udpHeader.SetSourcePort (sport);

  packet->AddHeader (udpHeader);

  m_downTarget (packet, saddr, daddr, PROT_NUMBER, route);
}

void
UdpL4Protocol::Send (Ptr<Packet> packet,
                     Ipv6Address saddr, Ipv6Address daddr,
                     uint16_t sport, uint16_t dport)
{
  NS_LOG_FUNCTION (this << packet << saddr << daddr << sport << dport);

  UdpHeader udpHeader;
  if(Node::ChecksumEnabled ())
    {
      udpHeader.EnableChecksums ();
      udpHeader.InitializeChecksum (saddr,
                                    daddr,
                                    PROT_NUMBER);
    }
  udpHeader.SetDestinationPort (dport);
  udpHeader.SetSourcePort (sport);

  packet->AddHeader (udpHeader);

  m_downTarget6 (packet, saddr, daddr, PROT_NUMBER, 0);
}

void
UdpL4Protocol::Send (Ptr<Packet> packet,
                     Ipv6Address saddr, Ipv6Address daddr,
                     uint16_t sport, uint16_t dport, Ptr<Ipv6Route> route)
{
  NS_LOG_FUNCTION (this << packet << saddr << daddr << sport << dport << route);

  UdpHeader udpHeader;
  if(Node::ChecksumEnabled ())
    {
      udpHeader.EnableChecksums ();
      udpHeader.InitializeChecksum (saddr,
                                    daddr,
                                    PROT_NUMBER);
    }
  udpHeader.SetDestinationPort (dport);
  udpHeader.SetSourcePort (sport);

  packet->AddHeader (udpHeader);

  m_downTarget6 (packet, saddr, daddr, PROT_NUMBER, route);
}

void
UdpL4Protocol::SetDownTarget (IpL4Protocol::DownTargetCallback callback)
{
  NS_LOG_FUNCTION (this);
  m_downTarget = callback;
}

IpL4Protocol::DownTargetCallback
UdpL4Protocol::GetDownTarget (void) const
{
  return m_downTarget;
}

void
UdpL4Protocol::SetDownTarget6 (IpL4Protocol::DownTargetCallback6 callback)
{
  NS_LOG_FUNCTION (this);
  m_downTarget6 = callback;
}

IpL4Protocol::DownTargetCallback6
UdpL4Protocol::GetDownTarget6 (void) const
{
  return m_downTarget6;
}

} // namespace ns3
```

# 参考文献

- [ns-3: src/internet/model/udp-l4-protocol.h Source File](https://www.nsnam.org/doxygen/udp-l4-protocol_8h_source.html)

