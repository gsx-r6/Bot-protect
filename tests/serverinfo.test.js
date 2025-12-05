const serverinfo = require('../src/commands/utility/serverinfo');

test('serverinfo command exports object with name and execute', () => {
  expect(serverinfo).toBeDefined();
  expect(serverinfo.name).toBe('serverinfo');
  expect(typeof serverinfo.execute).toBe('function');
});
