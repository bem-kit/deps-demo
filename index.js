const declNormalize = require('bem-decl/lib/normalize2')
const nodeEval = require('node-eval')
const inspect = require('util').inspect
const $ = selector => document.querySelector(selector)
const $$ = selector => Array.from(document.querySelectorAll(selector))
const omit = require('lodash/omit')

let stringify;
const stringifiers = {
    json: json => JSON.stringify(json, null, 4),
    inspect: json => inspect(json, { depth: null, maxArrayLength: null }),
};
const syncStringifier = what => {
    if (what) {
        localStorage.setItem('stringifier', what);
    } else {
        what = localStorage.getItem('stringifier');
    }
    stringify = stringifiers[what] || stringifiers.inspect;
};

const $status = $('.status')
const $input = document.getElementById('input')
const $output = document.getElementById('output')
const $examples = $('.examples')
const $stringifierInspect = $('#stringify-inspect')
const $stringifierJson = $('#stringify-json')

const log = args => ($status.innerHTML = args.toString(), $status.classList.remove('_ok'), $status.classList.remove('_error'))
const error = args => ($status.innerHTML = args.toString(), $status.classList.remove('_ok'), $status.classList.add('_error'))
const success = args => ($status.innerHTML = args.toString(), $status.classList.add('_ok'), $status.classList.remove('_error'))

const onOutput = val => {console.info('ok'); localStorage.setItem('input', $input.value)}
const output = val => {$output.value = val; onOutput(val)}
const onInput = () => {
    try {
        const builtDeps = declNormalize(nodeEval(input.value.trim()[0] === '{' ? `(${$input.value})` : input.value))
        const builtDeps_ = builtDeps.map(item => Object.assign({}, item.entity, omit(item, 'entity')));
        builtDeps_.forEach(item => (item.tech || (delete item.tech)));
        output(stringify(builtDeps_));
    } catch(e) {console.error(e);}
}

$stringifierJson.checked = localStorage.getItem('stringifier') === 'json'
$stringifierInspect.checked = !$stringifierJson.checked
syncStringifier()

$input.value = localStorage.getItem('input')
onInput()

// Без try catch этот код почему-то не работает  ¯\_(ツ)_/¯
try{
    (function (_log, _error, _info) {
        // console.log = arg => {_log(arg); log(arg)}
        console.error = arg => {_error(arg); error(arg)}
        console.info = arg => {_info(arg); success(arg)}
    })(console.log, console.error, console.info)
}catch(e){console.error('wtf', e);}

$input.addEventListener('input', onInput)
$stringifierInspect.addEventListener('change', () => (syncStringifier('inspect'), onInput()))
$stringifierJson.addEventListener('change', () => (syncStringifier('json'), onInput()))

const onExitExamples = () => {
    $examples.classList.add('_hidden');
    $$('.main').forEach(el=>el.classList.remove('_inactive'));
}

// todo: переписать на какой-нибудь популярный роутер
const go = (uri, link, shouldNotChangeHistory) => {
    uri = uri || '/'
    console.log('go', uri, link, shouldNotChangeHistory);
    switch(uri) {
        case '/examples': history.pushState({}, 'examples', '#!'+uri); $examples.classList.remove('_hidden'); $$('.main').forEach(el=>el.classList.add('_inactive')); break;
        case '/example': $input.value = link&&stringify(nodeEval(`(${link.dataset.content})`)); console.log('link.dataset.content', link.dataset.content); onInput(); console.log('done', link, uri); onExitExamples(); shouldNotChangeHistory || history.pushState({}, 'example', '/'); break;
        case '/': onExitExamples(); shouldNotChangeHistory || history.pushState({}, $('title').innerHTML, '#!'+uri); break;
        defalut: shouldNotChangeHistory || history.replaceState({},'404','#!/404')
    }
}

$$('a').forEach(a => a.onclick = e => {e.preventDefault(); go(new URL(e.target.href).pathname, e.target); return false})

const initPage = () => {

    go(location.hash.replace('#!',''))
}

window.onpopstate = () => {
    setTimeout(() => go(location.hash.replace('#!',''), null, true), 0)
}

initPage()

window.addEventListener('keyup', e => {
    e.keyCode === 27 && location.hash === '#!/examples' && go('/')
})
