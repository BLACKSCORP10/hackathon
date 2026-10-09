/**
 * WebRTC and ICE Server Configuration for NexusChat
 * Includes Open Relay TURN servers (openrelay.metered.ca:80 / :443)
 * for seamless cross-network traversal over mobile, cellular, and symmetric NAT firewalls.
 */

export const OPEN_RELAY_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:openrelay.metered.ca:80' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelay',
    credential: 'openrelay',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelay',
    credential: 'openrelay',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelay',
    credential: 'openrelay',
  },
];

export const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: OPEN_RELAY_ICE_SERVERS,
  iceCandidatePoolSize: 10,
};
