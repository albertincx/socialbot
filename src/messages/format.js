module.exports = {
  start: () => `Hi, send me any message which contains a links:

- From a channel/group by "Forward" a message links.
- By a direct text message links to me.`,
  resolved: () => 'This error resolved, please check link again',
  support: links => {
    let s = 'For support:';
    s += `${links.length ? `\n${links.join('\n\n')}` : ''}`;
    return s;
  },
};
