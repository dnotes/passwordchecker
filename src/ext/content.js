var crypto = window.crypto || window.msCrypto;
var timer, textTimer;
var txtEl;
var alertEl = [];
var els = document.querySelectorAll('input[type="password"]');
for (var i = 0; i < els.length; i++) {
  if (i === 0) {
    txtEl = document.documentElement.appendChild(document.createElement("passwordchecker"));
    txtEl.addEventListener('click', function() {
      clearTimeout(textTimer);
      txtEl.style.zIndex = -9999;
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
        alertEl[i].className = "check";
        txtEl.className = "";
        txtEl.textContent = "Passwords should be at least 8 characters."
      } else {
        alertEl[i].className = "check";
        txtEl.className = "";
        txtEl.textContent = "Checking...";
        clearTimeout(timer);
        timer = setTimeout(function(pw, el) {
          browser.runtime.sendMessage(pw).then(function(countBreaches) {
            if (el.value == pw) {
              if (countBreaches === 0) {
                alertEl[i].className = 'good';
                txtEl.className = 'good';
                txtEl.innerHTML = "This password was not found in past breaches."
              } else if (!isNaN(countBreaches)) {
                alertEl[i].className = 'pwned';
                txtEl.className = 'bad';
                txtEl.innerHTML = "This password has been exposed <b>" + countBreaches + "</b> time(s)."
              } else {
                alertEl[i].className = 'err';
                txtEl.className = 'bad';
                txtEl.textContent = "Error. Password could not be checked."
              }
            }
          }).catch(function(error) {
            var text = "Error. Password could not be checked.";
            if (!isNaN(error) && error > 0) {
              text += " Code: " + error;
            }
            alertEl[i].className = "err";
            txtEl.className = "bad";
            txtEl.textContent = text
          });
        }, 500, pw, this)
      }
      positionTextElement(el);
    });
  } else {
    alertEl[i].className = "bad";
    txtEl.className = "bad";
    txtEl.textContent = "Don't enter passwords here! This site does not use https!";
    txtEl.style.zIndex = 9999;
  }
  alertEl[i].addEventListener('click', function() {
    clearTimeout(textTimer);
    txtEl.style.zIndex = txtEl.style.zIndex * -1;
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
  txtEl.style.zIndex = 9999;
  textTimer = setTimeout(function() {
    if (!txtEl.className.match(/bad/)) {
      txtEl.style.zIndex = -9999;
    }
  }, 1500);
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
