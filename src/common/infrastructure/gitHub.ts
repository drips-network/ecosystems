async function gitHub() {
  const {Octokit} = await import('@octokit/rest');
  return new Octokit({auth: process.env.GITHUB_TOKEN});
}

export {gitHub};
