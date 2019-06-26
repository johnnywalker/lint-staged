import makeConsoleMock from 'consolemock'
import { cloneDeep } from 'lodash'
import { getConfig, validateConfig } from '../src/getConfig'

describe('getConfig', () => {
  it('should return config with defaults for undefined', () => {
    expect(getConfig()).toMatchSnapshot()
  })

  it('should return config with defaults', () => {
    expect(getConfig({})).toMatchSnapshot()
  })

  it('should set renderer based on debug mode', () => {
    expect(getConfig({})).toEqual(
      expect.objectContaining({
        renderer: 'update'
      })
    )

    expect(
      getConfig({
        '*.js': ['eslint', 'git add']
      })
    ).toEqual(
      expect.objectContaining({
        renderer: 'update'
      })
    )

    expect(getConfig({}, true)).toEqual(
      expect.objectContaining({
        renderer: 'verbose'
      })
    )
  })

  it('should set linters', () => {
    expect(getConfig()).toEqual(
      expect.objectContaining({
        linters: {}
      })
    )

    expect(getConfig({})).toEqual(
      expect.objectContaining({
        linters: {}
      })
    )

    expect(
      getConfig({
        '*.js': 'eslint'
      })
    ).toEqual(
      expect.objectContaining({
        linters: {
          '*.js': 'eslint'
        }
      })
    )

    expect(
      getConfig({
        linters: {
          '*.js': ['eslint --fix', 'git add'],
          '.*rc': 'jsonlint'
        }
      })
    ).toMatchSnapshot()

    expect(
      getConfig({
        linters: {
          '*.js': filenames => {
            const files = filenames.join(' ')
            return `eslint --fix ${files} && git add ${files}`
          }
        }
      })
    ).toMatchSnapshot()
  })

  it('should deeply merge configs', () => {
    expect(
      getConfig({
        globOptions: {
          nocase: true
        }
      })
    ).toEqual(
      expect.objectContaining({
        globOptions: {
          nocase: true,
          matchBase: true,
          dot: true
        }
      })
    )
  })

  it('should not add plain linters object to the full config', () => {
    expect(
      getConfig({
        '*.js': 'eslint'
      })
    ).not.toEqual(
      expect.objectContaining({
        '*.js': 'eslint'
      })
    )
  })

  it('should not change config if the whole config was passed', () => {
    const src = {
      concurrent: true,
      globOptions: {
        matchBase: false,
        dot: true
      },
      linters: {
        '*.js': 'eslint'
      },
      ignore: ['docs/**/*.js'],
      renderer: 'custom',
      relative: true
    }
    expect(getConfig(cloneDeep(src))).toEqual(src)
  })
})

describe('validateConfig', () => {
  const originalConsole = global.console
  beforeAll(() => {
    global.console = makeConsoleMock()
  })

  beforeEach(() => {
    global.console.clearHistory()
  })

  afterAll(() => {
    global.console = originalConsole
  })

  it('should throw and should print validation errors for invalid config', () => {
    const invalidAdvancedConfig = {
      foo: false,
      ignore: false
    }
    expect(() => validateConfig(getConfig(invalidAdvancedConfig))).toThrowErrorMatchingSnapshot()
  })

  it('should throw and should print validation errors for invalid linter config', () => {
    const invalidAdvancedConfig = {
      foo: false,
      linters: {
        '*.js': 1
      }
    }
    expect(() => validateConfig(getConfig(invalidAdvancedConfig))).toThrowErrorMatchingSnapshot()
  })

  it('should not throw and should print validation warnings for mixed config', () => {
    const invalidMixedConfig = {
      ignore: ['**/*.test.js'],
      '*.js': ['eslint --fix', 'git add']
    }
    expect(() => validateConfig(getConfig(invalidMixedConfig))).not.toThrow()
    expect(console.printHistory()).toMatchSnapshot()
  })

  it('should print deprecation warning for deprecated options', () => {
    const baseConfig = {
      linters: {
        '*.js': ['eslint --fix', 'git add']
      }
    }
    const opts = [{ gitDir: '../' }, { verbose: true }]
    opts.forEach(opt => {
      const configWithDeprecatedOpt = Object.assign(opt, baseConfig)
      expect(() => validateConfig(getConfig(configWithDeprecatedOpt))).not.toThrow()
    })
    expect(console.printHistory()).toMatchSnapshot()
  })

  it('should not throw and should print nothing for simple valid config', () => {
    const validSimpleConfig = {
      '*.js': ['eslint --fix', 'git add']
    }
    expect(() => validateConfig(getConfig(validSimpleConfig))).not.toThrow()
    expect(console.printHistory()).toMatchSnapshot()
  })

  it('should not throw and should print nothing for advanced valid config', () => {
    const validAdvancedConfig = {
      ignore: ['**/*.test.js'],
      linters: {
        '*.js': ['eslint --fix', 'git add']
      }
    }
    expect(() => validateConfig(getConfig(validAdvancedConfig))).not.toThrow()
    expect(console.printHistory()).toMatchSnapshot()
  })

  it('should not throw and should print nothing for custom renderer', () => {
    const validAdvancedConfig = {
      renderer: () => {}
    }
    expect(() => validateConfig(getConfig(validAdvancedConfig))).not.toThrow()
    expect(console.printHistory()).toMatchSnapshot()
  })

  it('should not throw and should print nothing for function linter', () => {
    expect(() =>
      validateConfig(
        getConfig({
          linters: {
            '*.js': filenames => {
              const files = filenames.join(' ')
              return `eslint --fix ${files} && git add ${files}`
            },
            '*.css': [filenames => filenames.map(filename => `eslint --fix ${filename}`)]
          }
        })
      )
    ).not.toThrow()
    expect(console.printHistory()).toMatchSnapshot()
  })
})
