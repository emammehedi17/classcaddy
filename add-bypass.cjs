const fs = require('fs');
let content = fs.readFileSync('src/components/ArchivesView.tsx', 'utf8');

const target = `                <button
                  id="submit-auth-btn"
                  type="submit"
                  disabled={isAuthenticating || !pinInput.trim()}
                  className={\`px-5 py-2 text-xs font-semibold text-white rounded-lg shadow-md transition disabled:opacity-50 \${
                    isDark
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }\`}
                >
                  {isAuthenticating ? 'Verifying...' : 'Authenticate'}
                </button>
              </div>`;

const replacement = `                <button
                  id="submit-auth-btn"
                  type="submit"
                  disabled={isAuthenticating || !pinInput.trim()}
                  className={\`px-5 py-2 text-xs font-semibold text-white rounded-lg shadow-md transition disabled:opacity-50 \${
                    isDark
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }\`}
                >
                  {isAuthenticating ? 'Verifying...' : 'Authenticate'}
                </button>
              </div>
              {isSuperAdmin && (
                <div className="mt-4 pt-4 border-t border-gray-700/60 dark:border-gray-800 text-center">
                  <p className={\`text-xs mb-2 \${isDark ? 'text-gray-400' : 'text-slate-500'}\`}>
                    You are logged in as admin. You can bypass the password.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeveloperMode(true);
                      sessionStorage.setItem(DEV_AUTH_KEY, 'true');
                      setShowAuthModal(false);
                      setAuthError('');
                      setPinInput('');
                    }}
                    className={\`w-full px-4 py-2 text-xs font-semibold rounded-lg border transition \${
                      isDark
                        ? 'bg-gray-800 hover:bg-gray-700 text-emerald-400 border-gray-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-emerald-700 border-slate-300'
                    }\`}
                  >
                    Bypass with Admin Email
                  </button>
                </div>
              )}`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/ArchivesView.tsx', content);
