let round = Math.round

// 基于部分机型进行html100%高hidden处理
let fixHtml = (function () {
  let isFixed = false
  // 创建样式
  let style = document.createElement('style')
  style.innerHTML = '.fixed-html{ height: 100%; overflow: hidden }'
  document.head.appendChild(style)

  return function (isFix) {
    if (isFix === isFixed) {
      return
    }
    isFixed = isFix
    let html = document.documentElement
    let htmlClassName = html.className
    html.className = isFix
      ? htmlClassName + ' fixed-html'
      : htmlClassName.replace('fixed-html', '').trim('')
  }
})()

function listenDomAttrChange(element, callback) {
  let MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
  let observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === "attributes") {
        callback(mutation.target.className, mutation.target.style.display)
      }
    })
  })
  observer.observe(element, {
    attributes: true,
    // attributeOldValue: true,
    attributeFilter: ['class', 'style']
  })
}

function getEventPath(e) {
  return e.composedPath ? e.composedPath() : e.path
}

function eachComposePath(pathNodes, callback) {
  for (let i = 0, len = pathNodes.length; i < len; i++) {
    let className = pathNodes[i].className
    if (className && callback(className)) {
      return true
    }
  }
  return false
}

function onceClassPass(nodes, classList) {
  return eachComposePath(nodes, function (className) {
    for (let i = 0, len = classList.length; i < len; i++) {
      if (className.indexOf(classList[i]) !== -1) {
        return true
      }
    }
    return false
  })
}

// 当可滚动容器置顶或置底时，阻止默认事件，阻止冒泡会导致zepto无法接收touchmove事件使touchmove后也能触发tap事件
function disableScrollWhenTopOrBottom(scrollNode) {
  var top = true, bottom = true, start = 0, maxTop = 0
  scrollNode.ontouchstart = function (e) {
    let scrollTop = this.scrollTop
    maxTop = round(this.scrollHeight - this.clientHeight)
    top = scrollTop === 0
    bottom = round(scrollTop) === maxTop
    start = e.targetTouches[0].pageY
  }
  scrollNode.ontouchmove = function (e) {
    let touch = e.targetTouches[0].pageY
    let scrollTop = this.scrollTop
    top = scrollTop === 0
    bottom = round(scrollTop) === maxTop
    if (top && (touch > start)) {
      e.preventDefault()
    }
    if (bottom && (touch < start)) {
      e.preventDefault()
    }
  }
}

// 阻止可滑动容器以外的一切滚动
function disableScrollOutside(fixedNode, scrollClassNameList) {
  fixedNode.addEventListener('touchmove', function (e) {
    if (onceClassPass(getEventPath(e), scrollClassNameList)) {
      return
    }
    e.preventDefault()
  })
}
/*
@params

fixedNode: 遮罩层容器节点
scrollQueryClassNameList: 容器节点内所有可滚动区域节点的selector example: .scroll #scroll

*/
function preventScroll(fixedNode, scrollQueryClassNameList) {
  if (typeof scrollQueryClassNameList === 'string') {
    scrollQueryClassNameList = [scrollQueryClassNameList]
  }
  disableScrollOutside(fixedNode, scrollQueryClassNameList.map(className => className.slice(1)))
  scrollQueryClassNameList.forEach((scrollClass) => {
    disableScrollWhenTopOrBottom(document.querySelector(scrollClass))
  })
  listenDomAttrChange(fixedNode, function (className, display) {
    let shouldFix
    if (display === 'none') {
      shouldFix = false
    } else if (className.indexOf('hide') !== -1) {
      shouldFix = false
    } else {
      shouldFix = true
    }
    fixHtml(shouldFix)
  })
}
