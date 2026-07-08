/**
 * Converts an email address to a Kubernetes-compatible username, replacing each special character with a unique digit for reversibility and to avoid collisions.
 *
 * - Removes everything after the last '.' in the email.
 * - Lowercases the email.
 * - Maps special characters:
 *   'ö' → '1', 'ü' → '2', 'ä' → '3', '.' → '4', '_' → '5', '*' → '6', '^' → '7', '#' → '8'
 * - [a-z], [0-9], '-' are allowed as is.
 * - '@' is replaced with '-'.
 * - All other non-allowed characters are replaced with '9'.
 * - The result is truncated to 63 characters.
 */
function emailToK8sUsername(email) {
  // Remove everything after the last '.'
  const lastDot = email.lastIndexOf('.');
  if (lastDot !== -1) {
    email = email.substring(0, lastDot);
  }
  email = email.toLowerCase();
  const customMap = {
    'ö': '1',
    'ü': '2',
    'ä': '3',
    '.': '4',
    '_': '5',
    '*': '6',
    '^': '7',
    '#': '8'
  };
  const k8sUrlAllowed = /^[a-z0-9-]$/;
  let username = '';
  for (const c of email) {
    if (customMap[c]) {
      username += customMap[c];
    } else if (k8sUrlAllowed.test(c)) {
      username += c;
    } else if (c === '@') {
      username += '-';
    } else {
      username += '9';
    }
  }
  return username.substring(0, 63);
}

async function getUserEmail() {
    try {
        const response = await fetch(
            'https://academy.neonto.de/api/user/metadata',
            {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'use-jwt-cookie': 'true'
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to load user metadata: ${response.status}`
            );
        }

        const data = await response.json();

        if (!data.email) {
            throw new Error('Response does not contain an email field.');
        }

        return data.email;

    } catch (error) {
        console.error('Could not load user email:', error);
        return null;
    }
}


async function goToSandbox(workspaceName){
    const email = await getUserEmail();

    if (!email) {
        return;
    }

    const subdomain = emailToK8sUsername(email);
    let sandboxUrl = `https://${subdomain}.mysandbox.neonto.de`;

    window.open(sandboxUrl + "/?workspace=/"+ workspaceName +".code-workspace", '_blank').focus();
}