(function () {
  function getCopyText(pre) {
    var code = pre.querySelector("code");
    return (code || pre).innerText.replace(/\n$/, "");
  }

  function copyWithFallback(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    } finally {
      document.body.removeChild(textarea);
    }
  }

  function addCopyButton(pre) {
    if (pre.classList.contains("terminal-output-panel")) {
      return;
    }

    var wrapper = document.createElement("div");
    wrapper.className = "copy-code-block";
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    var button = document.createElement("button");
    button.className = "copy-code-button";
    button.type = "button";
    button.textContent = "Copy";
    button.setAttribute("aria-label", "Copy code");
    wrapper.appendChild(button);

    button.addEventListener("click", function () {
      copyWithFallback(getCopyText(pre)).then(function () {
        button.textContent = "Copied";
        window.setTimeout(function () {
          button.textContent = "Copy";
        }, 1600);
      }).catch(function () {
        button.textContent = "Try again";
        window.setTimeout(function () {
          button.textContent = "Copy";
        }, 1600);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("pre").forEach(addCopyButton);
  });
}());
