const unfluff = require('unfluff')
const fetch = require('fetch-everywhere')


document.addEventListener('DOMContentLoaded', () => {
  const fetchBtn = document.getElementById('fetch-btn')
  const urlInput = document.getElementById('url-input')
  const titleDisplay = document.getElementById('title-display')
  const descDisplay = document.getElementById('desc-display')
  const linkDisplay = document.getElementById('link-display')
  const textDisplay = document.getElementById('text-display')


  fetchBtn.addEventListener('click', async () => {
    const html = await fetch(urlInput.value).then(res => res.text())
    const { title, description, canonicalLink, text } = unfluff(html)

    titleDisplay.innerHTML = title
    descDisplay.innerHTML = description
    linkDisplay.innerHTML = canonicalLink
    linkDisplay.href = canonicalLink
    textDisplay.innerHTML = text
  })
})
