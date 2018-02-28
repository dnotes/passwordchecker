var crypto = window.crypto || window.msCrypto;
var timer, textTimer;
var txtEl;
var alertEl = [];
var status = "";
var els = document.querySelectorAll('input[type="password"]');
for (var i = 0; i < els.length; i++) {
  if (i === 0) {
    txtEl = document.documentElement.appendChild(document.createElement("passwordchecker"));
    txtEl.addEventListener('click', function() {
      clearTimeout(textTimer);
      hideTextElement();
    })
  }
  var tmpEl = document.documentElement.appendChild(document.createElement("passwordstatus"));
  alertEl.push(tmpEl);
  els[i].passwordcheckerid = i;
  if (location.protocol === 'https:') {
    els[i].addEventListener('keyup', function(e) {
      var el = e.currentTarget;
      var i = el.passwordcheckerid;
      var offset = getOffset(el);
      alertEl[i].style.top = (offset.top + (el.offsetHeight / 2)) + "px";
      alertEl[i].style.left = ((offset.left + el.offsetWidth) - 34) + "px";
      var pw = this.value;
      if (pw.length < 8) {
        status = alertEl[i].className = txtEl.className = "check";
        txtEl.textContent = "Passwords should be at least 8 characters."
        positionTextElement(el);
      } else {
        status = alertEl[i].className = txtEl.className = "check";
        txtEl.textContent = "Checking...";
        clearTimeout(timer);
        timer = setTimeout(function(pw, el) {
          browser.runtime.sendMessage(pw).then(function(countBreaches) {
            if (el.value == pw) {
              if (countBreaches === 0) {
                status = alertEl[i].className = txtEl.className = "good";
                txtEl.innerHTML = "This password was not found in past breaches."
              } else if (!isNaN(countBreaches)) {
                alertEl[i].className = 'pwned';
                status = txtEl.className = 'bad';
                txtEl.innerHTML = "This password has been exposed <b>" + countBreaches + "</b> time(s)."
              } else {
                alertEl[i].className = 'err';
                status = txtEl.className = 'bad';
                txtEl.textContent = "Error. Password could not be checked."
              }
            }
            positionTextElement(el);
          }).catch(function(error) {
            var text = "Error. Password could not be checked.";
            if (!isNaN(error) && error > 0) {
              text += " Code: " + error;
            }
            alertEl[i].className = "err";
            status = txtEl.className = "bad";
            txtEl.textContent = text
            positionTextElement(el);
          });
        }, 500, pw, this)
      }
    });
  } else {
    status = alertEl[i].className = txtEl.className = "bad";
    txtEl.textContent = "Don't enter passwords here! This site does not use https!";
    showTextElement();
  }
  alertEl[i].addEventListener('click', function() {
    clearTimeout(textTimer);
    toggleTextElement();
  })
}

function positionTextElement(el) {
  var offset = getOffset(el);
  clearTimeout(textTimer);
  txtEl.style.left = ((offset.left + el.offsetWidth) - txtEl.offsetWidth) + "px";
  if (true) { // TODO: allow for when the text element would appear below the screen
    txtEl.style.top = (offset.top + el.offsetHeight + 5) + "px";
  }
  else {
    txtEl.style.top = (offset.top - 71) + "px";
  }
  textTimer = setTimeout(function() {
    if (status === "good") {
      hideTextElement();
    }
  }, 2400);
  showTextElement();
}

function toggleTextElement() {
  txtEl.style.zIndex = txtEl.style.zIndex * -1;
  txtEl.style.opacity = (txtEl.style.zIndex < 0 ? 0.01 : 1);
}

function showTextElement() {
  txtEl.style.zIndex = 9999;
  txtEl.style.opacity = 1;
}

function hideTextElement() {
  txtEl.style.opacity = 0.01;
  txtEl.style.zIndex = -9999;
}

function getOffset(el) {
  var _x = 0;
  var _y = 0;
  while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
    _x += el.offsetLeft - el.scrollLeft;
    _y += el.offsetTop - el.scrollTop;
    el = el.offsetParent;
  }
  return { top: _y, left: _x };
}
