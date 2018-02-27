var crypto = window.crypto || window.msCrypto
var timer
var txtEl
var alertEl = []
var els = document.querySelectorAll('input[type="password"]')
for (var i = 0; i < els.length; i++) {
    if (i === 0) {
        txtEl = document.documentElement.appendChild(document.createElement("passwordchecker"))
    }
    var tmpEl = document.documentElement.appendChild(document.createElement("passwordstatus"));
    alertEl.push(tmpEl)
    els[i].passwordcheckerid = i;
    var rect = els[i].getBoundingClientRect();
    alertEl[i].style.top = (rect.bottom - (rect.height / 2)) + "px";
    alertEl[i].style.left = (rect.right - 34) + "px";
    if (location.protocol === 'https:') {
        els[i].addEventListener('keyup', function(e) {
            var el = e.currentTarget;
            var i = el.passwordcheckerid;
            var pw = this.value
            if (pw.length < 8) {
                alertEl[i].className = "check"
                txtEl.className = ""
                txtEl.textContent = "Passwords should be at least 8 characters."
            } else {
                alertEl[i].className = "check"
                txtEl.className = ""
                txtEl.textContent = "Checking..."
                clearTimeout(timer)
                timer = setTimeout(function(pw, el) {
                    checkPassword(pw).then(function(countBreaches) {
                        if (el.value == pw) {
                            if (countBreaches === 0) {
                                alertEl[i].className = 'good'
                                txtEl.className = 'good';
                                txtEl.innerHTML = "This password was not found in past breaches."
                            } else if (!isNaN(countBreaches)) {
                                alertEl[i].className = 'pwned'
                                txtEl.className = 'bad'
                                txtEl.innerHTML = "This password has been exposed " + countBreaches + " time(s)."
                            } else {
                                alertEl[i].className = 'err'
                                txtEl.className = 'bad'
                                txtEl.textContent = "Error. Password could not be checked."
                            }
                        }
                    }, function(error) {
                        var text = "Error. Password could not be checked.";
                        if (!isNaN(error) && error > 0) {
                            text += " Code: " + error;
                        }
                        alertEl[i].className = "err"
                        txtEl.className = "bad"
                        txtEl.textContent = text
                    });
                }, 500, pw, this)
            }
        });
    } else {
        alertEl[i].className = "bad"
        txtEl.className = "bad"
        txtEl.textContent = "Don't enter passwords here! This site does not use https!"
        txtEl.style.display = 'block';
    }
    alertEl[i].addEventListener('click', function() {
        txtEl.style.display = 'block';
    })
}
txtEl.addEventListener('click', function() {
    txtEl.style.display = 'none';
})

function checkPassword(password) {
    return new Promise(function(resolve, reject) {
        if (password.length < 6) {
            // Passwords shorter than 6 characters are not checked because it might compromise anonymity
            // if the input is not debounced correctly.
            reject(Error("Password too short."))
        }
        sha1(password).then(function(hash) {
            var sendhash = hash.substr(0, 5)
            var checkhash = new RegExp(hash.substr(5) + ':(\\d+)', 'i')
            var req = new XMLHttpRequest()
            req.open('GET', 'https://api.pwnedpasswords.com/range/' + sendhash)
            req.onload = function() {
                if (req.status >= 200 && req.status < 400) {
                    if (!req.responseText.match(/^[0-9a-fA-F]{35}:/)) {
                        reject(Error(req.responseText))
                    }
                    var found = req.responseText.match(checkhash)
                    var count = found ? found[1] : 0
                    resolve(count)
                } else {
                    reject(Error(req.status))
                }
            }
            req.onerror = function() {
                reject(Error('Network error'))
            }
            req.send()
        }, function(error) {
            reject(error);
        })
    })
}

function sha1(str) {
    var buffer = new TextEncoder('utf-8').encode(str) // encode as UTF-8
    return crypto.subtle.digest('SHA-1', buffer).then(function(hash) {
        return hex(hash)
    });
}

function hex(buffer) {
    var hexCodes = []
    var view = new DataView(buffer)
    for (var i = 0; i < view.byteLength; i += 4) {
        // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
        var value = view.getUint32(i)
        // toString(16) will give the hex representation of the number without padding
        var stringValue = value.toString(16)
        // We use concatenation and slice for padding
        var padding = '00000000'
        var paddedValue = (padding + stringValue).slice(-padding.length)
        hexCodes.push(paddedValue);
    }
    // Join all the hex strings into one
    return hexCodes.join("")
}
