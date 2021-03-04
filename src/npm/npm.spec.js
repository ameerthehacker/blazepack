const { getRegistries } = require('./utils/index');
const fs = require('fs');
const cwd = process.cwd();

describe('npm utils', () => {
  it('should return the available registried', () => {
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn().mockReturnValue(`
      @myscope:registry=http://localhost:4873
      @myanotherscope:registry=http://localhost:4873
      registry=https://registry.npmjs.org
      //registry.npmjs.org/:_authToken=secret
      init-author-name=Ameer Jhan
      //localhost:4873/:_authToken=token
    `);

    const registries = getRegistries(cwd);

    expect(registries).toEqual([
      {
        scopes: ['myscope', 'myanotherscope'],
        registry: 'http://localhost:4873',
        token: 'token',
      },
      {
        scopes: [],
        registry: 'https://registry.npmjs.org',
        token: 'secret',
      },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
