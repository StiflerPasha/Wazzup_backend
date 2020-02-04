const blockedDomains = ['https://yahoo.com', 'https://socket.io'];

export const linkConstraints = (link) => ({
  url: {
    message: {
      code: 'BOOKMARKS_INVALID_LINK',
      description: 'Invalid link'
    }
  },
  exclusion: {
    within: blockedDomains,
    message: {
      code: 'BOOKMARKS_BLOCKED_DOMAIN',
      description: `${link.split('//')[1]} banned`
    }
  },
  presence: {
    message: {
      code: 'BOOKMARKS_REQUIRED_LINK',
      description: 'Link is required'
    }
  }
});

export const descConstraints = {};

export const favConstraints = {};
