'use strict'

const escape = require('cross-spawn/lib/util/escape')

/**
 * Escape a shell argument for Unix shells. Double-escape spaces for execa.
 * @see https://qntm.org/cmd
 * @see https://github.com/sindresorhus/execa/blob/a827d82203a1440e585276bef5d399a5953801f1/lib/command.js#L20
 * @param {string} arg the argument
 * @returns {string} the escaped argument
 */
const escapeUnixShellArg = (arg) =>
  `${arg.replace(/([^a-zA-Z0-9_])/g, '\\$1').replace(/( )/g, '\\$1')}`

/**
 * Escape a shell argument for the Windows cmd.exe shell
 * @see https://qntm.org/cmd
 * @param {string} arg the argument
 * @returns {string} the escaped argument
 */
const escapeWinCmdArg = (arg) => escape.argument(arg)

const currentPlatform = process.platform

/**
 * "Internally" expose the platform option for testing
 * @param {string} arg the argument
 * @param {string} [platform] the current platform
 */
const _escapeArg = (arg, platform = currentPlatform) => {
  const isWin = platform === 'win32'
  return isWin ? escapeWinCmdArg(arg) : escapeUnixShellArg(arg)
}

/**
 * Escape a shell argument based on the current platform
 * @param {string} arg the argument
 */
const escapeArg = (arg) => _escapeArg(arg)

module.exports = {
  _escapeArg,
  escapeArg,
  escapeUnixShellArg,
  escapeWinCmdArg,
}
