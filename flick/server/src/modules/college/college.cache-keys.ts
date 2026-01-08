const collegeCacheKeys = {
  id: (id: string) => `college:id:${id}`,
  emailDomain: (emailDomain: string) => `college:emailDomain:${emailDomain}`,
  all: (filters?: { city?: string; state?: string }) =>
    `college:all:${filters?.city || 'all'}:${filters?.state || 'all'}`,
};

export default collegeCacheKeys