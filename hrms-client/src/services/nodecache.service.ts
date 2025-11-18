import NodeCache from 'node-cache';

// Now use it normally
const nodeCache = new NodeCache({ stdTTL: 300 });

export default nodeCache