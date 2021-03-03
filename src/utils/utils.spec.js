const fs = require('fs');
const path = require('path');
const { detectTemplate } = require('./index');

jest.mock('fs');

function mockFile(filePath, content) {
  fs.existsSync = jest.fn().mockImplementation((file) => {
    if (file === filePath) return true;
    else return false;
  });

  if (content) fs.readFileSync = jest.fn().mockReturnValue(content);
}

describe('utils', () => {
  const cwd = process.cwd();
  const sandboxConfig = path.join(cwd, 'sandbox.config.json');
  const packageJSON = path.join(cwd, 'package.json');

  describe('detect templates', () => {
    it('should throw error when there is no package.json and sandbox.config.json', () => {
      fs.existsSync = jest.fn().mockReturnValue(false);

      expect(() => detectTemplate(cwd)).toThrow('Unknown project template!');
    });

    it('should detect template from sandbox config json', () => {
      mockFile(
        sandboxConfig,
        JSON.stringify({
          template: 'static',
        })
      );

      expect(detectTemplate(cwd)).toBe('static');
    });

    it('should throw when there is invalid sandbox config file', () => {
      mockFile(sandboxConfig, 'invalid json');

      expect(() => detectTemplate(cwd)).toThrow('Invalid sandbox.config.json');
    });

    it('should detect react template', () => {
      mockFile(
        packageJSON,
        JSON.stringify({
          dependencies: {
            'react-scripts': '2.0.0',
          },
        })
      );

      expect(detectTemplate(cwd)).toBe('react');
    });

    it('should detect svelte template', () => {
      mockFile(
        packageJSON,
        JSON.stringify({
          dependencies: {
            svelte: '2.0.0',
          },
        })
      );

      expect(detectTemplate(cwd)).toBe('svelte');
    });

    it('should detect reason template', () => {
      mockFile(
        packageJSON,
        JSON.stringify({
          dependencies: {
            'reason-react': '2.0.0',
          },
        })
      );

      expect(detectTemplate(cwd)).toBe('reason-reason');
    });

    it('should detect parcel template', () => {
      mockFile(
        packageJSON,
        JSON.stringify({
          dependencies: {
            'parcel-bundler': '2.0.0',
          },
        })
      );

      expect(detectTemplate(cwd)).toBe('parcel');
    });

    it('should detect angular template', () => {
      mockFile(
        packageJSON,
        JSON.stringify({
          dependencies: {
            '@angular/core': '2.0.0',
          },
        })
      );

      expect(detectTemplate(cwd)).toBe('angular');
    });

    it('should detect vue template', () => {
      mockFile(
        packageJSON,
        JSON.stringify({
          devDependencies: {
            '@vue/cli-service': '2.0.0',
          },
        })
      );

      expect(detectTemplate(cwd)).toBe('vue');
    });

    it('should detect dojo template', () => {
      mockFile(
        packageJSON,
        JSON.stringify({
          devDependencies: {
            '@dojo/cli': '2.0.0',
          },
        })
      );

      expect(detectTemplate(cwd)).toBe('dojo');
    });

    it('should detect cxjs template', () => {
      mockFile(
        packageJSON,
        JSON.stringify({
          dependencies: {
            'cx-react': '2.0.0',
          },
        })
      );

      expect(detectTemplate(cwd)).toBe('cxjs');
    });

    it('should throw when no templates can be detected', () => {
      mockFile(packageJSON, JSON.stringify({}));

      expect(() => detectTemplate(cwd)).toThrow('Unknown project template!');
    });

    it('should throw when invalid package.json is present', () => {
      mockFile(packageJSON, 'invalid package json');

      expect(() => detectTemplate(cwd)).toThrow('Invalid package.json');
    });
  });

  afterEach(() => jest.clearAllMocks());
});
