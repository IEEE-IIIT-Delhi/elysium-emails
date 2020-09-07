require('dotenv').config()

const { Octokit } = require('@octokit/rest')
const { validate } = require('email-validator')

const { GIST_ID, GH_TOKEN } = process.env

const octokit = new Octokit({ auth: `token ${GH_TOKEN}` }) // Instantiate Octokit

const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  return await fn(req, res)
}

async function handler (req, res) {
  const { email } = req.body
  if (!validate(email)) {
    return res.json({ success: false })
  }
  const gist = await octokit.gists.get({ gist_id: GIST_ID })
  const emails = JSON.parse(gist.data.files['emails.json'].content)
  if (email in emails) {
    return res.json({ success: false })
  }
  emails.push(email)
  console.log({email, emails})
  await octokit.gists.update({
    gist_id: GIST_ID,
    files: {
      'emails.json': {
        content: JSON.stringify(emails, null, '  ')
      }
    }
  })
  return res.json({ success: true })
}

module.exports = allowCors(handler)
