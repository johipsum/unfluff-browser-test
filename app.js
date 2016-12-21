const unfluff = require('unfluff')
const fetch = require('fetch-everywhere')


document.addEventListener('DOMContentLoaded', () => {
  const fetchBtn = document.getElementById('fetch-btn')
  const urlInput = document.getElementById('url-input')
  const titleDisplay = document.getElementById('title-display')
  const descDisplay = document.getElementById('desc-display')
  const linkDisplay = document.getElementById('link-display')
  const textDisplay = document.getElementById('text-display')


  fetchBtn.addEventListener('click', () => {
    fetch(urlInput.value)
      .then(res => res.text())
      .then(html => unfluff(html))
      .then(({ title, description, canonicalLink, text }) => {
        titleDisplay.innerHTML = title
        descDisplay.innerHTML = description
        linkDisplay.innerHTML = canonicalLink
        linkDisplay.href = canonicalLink
        textDisplay.innerHTML = text
      })
  })
})
