:: naive-nmi [tirrel]
::
::
/-  *naive-nmi
/+  default-agent, dbug, verb, server
|%
+$  card  card:agent:gall
::$:  card=*'4111111111111111'
::    expiration=*'10/25'
::    amount=*'1.00'
::    cvv=*'999'
::    zip=*'77777'
::==
::
+$  state-0
  $:  %0
      api-key=(unit cord)
      redirect-url=(unit cord)
      =transactions
      =request-to-time
      =request-to-token
      =token-to-request
  ==
::  TODO: add rate-limits for POST requests
++  api-url  'https://secure.networkmerchants.com/api/v2/three-step'
--
::
=|  state-0
=*  state  -
::
%-  agent:dbug
%+  verb  |
^-  agent:gall
|_  =bowl:gall
+*  this  .
    def   ~(. (default-agent this %|) bowl)
::
++  on-init
  :_  this
  [%pass /connect %arvo %e %connect [~ /'market'] dap.bowl]~
::
++  on-save   !>(state)
++  on-load
  |=  old-vase=vase
  ^-  (quip card _this)
  =/  old  !<(state-0 old-vase)
  `this(state old)
::
++  on-poke
  |=  [=mark =vase]
  ^-  (quip card _this)
  ?>  (team:title our.bowl src.bowl)
  |^
  ?+    mark  (on-poke:def mark vase)
      %naive-nmi-action
    =^  cards  state
      (naive-nmi-action !<(action vase))
    [cards this]
  ::
      %handle-http-request
    =+  !<([eyre-id=@ta =inbound-request:eyre] vase)
    =|  sim=simple-payload:http
    =^  cards  sim
      (handle-http-request eyre-id inbound-request)
    =?  request-to-time  ?=(%'POST' method.request.inbound-request)
      (~(put by request-to-time) eyre-id now.bowl)
    :_  this
    %+  weld  cards
    (give-simple-payload:app:server eyre-id sim)
  ==
  ::
  ++  handle-http-request
    |=  [eyre-id=@ta =inbound-request:eyre]
    |^
    ^-  [(list card) simple-payload:http]
    =/  req-line=request-line:server
      %-  parse-request-line:server
      url.request.inbound-request
    =*  req-head  header-list.request.inbound-request
    =*  req-body  body.request.inbound-request
    ?:  ?=(%'GET' method.request.inbound-request)
      `(handle-get-request req-head req-line)
    ?:  ?=(%'POST' method.request.inbound-request)
      (handle-post-request req-head req-line req-body)
    `not-found:gen:server
    ::
    +$  partial-action
      $%  [%initiate-sale who=ship sel=selector:nam]
          [%complete-sale token=cord]
      ==
    ::
    ++  handle-post-request
      =*  srv  server
      |=  [headers=header-list:http req=request-line:srv bod=(unit octs)]
      ?~  bod
        `[[400 ~] ~]
      ?~  maybe-json=(de-json:html q.u.bod)
        `[[400 ~] ~]
      =/  act=(each partial-action tang)
        (mule |.((dejs u.maybe-json)))
      ?:  ?=(%| -.act)
        `[[400 ~] ~]
      ?-    -.p.act
          %initiate-sale
        =/  =action  [-.p.act eyre-id who.p.act sel.p.act]
        :_  [[201 ~] `(json-to-octs:srv s+eyre-id)]
        =-  [%pass /post-req/[eyre-id] %agent [our dap]:bowl %poke -]~
        [%naive-nmi-action !>(action)]
      ::
          %complete-sale
        =/  =action  [-.p.act token.p.act]
        ?~  maybe-request=(~(get by token-to-request) token.p.act)
          ~&  %failed
          `[[400 ~] ~]
        :_  [[201 ~] `(json-to-octs:srv s+eyre-id)]
        =-  [%pass /post-req/[eyre-id] %agent [our dap]:bowl %poke -]~
        [%naive-nmi-action !>(action)]
      ==
    ::
    ++  dejs
      =,  dejs:format
      |^
      %-  of
      :~  [%initiate-sale init-sale]
          [%complete-sale so]
      ==
      ::
      ++  init-sale
        %-  ot
        :~  who+(su ;~(pfix sig fed:ag))
            sel+selector
        ==
      ::
      ++  selector
        |=  jon=json
        ^-  selector:nam
        ?>  ?=(^ jon)
        ?+  -.jon  !!
          %n  [%| (ni jon)]
          %a  [%& ((as (su ;~(pfix sig fed:ag))) jon)]
        ==
      --
    ::
    ++  handle-get-request
      =*  srv  server
      |=  [hed=header-list:http req=request-line:srv]
      ^-  simple-payload:http
      ::  TODO: make this generic
      =?  site.req  ?=([%'market' *] site.req)
        t.site.req
      ?~  ext.req
        $(ext.req `%html, site.req [%index ~])
      ?.  ?=(%json u.ext.req)
        =/  file=(unit octs)
          (get-file-at /app/naive-nmi site.req u.ext.req)
        ?~  file   not-found:gen:srv
        ?+  u.ext.req  not-found:gen:srv
          %html  (html-response:gen:srv u.file)
          %js    (js-response:gen:srv u.file)
          %css   (css-response:gen:srv u.file)
        ==
      ?~  site.req
        not-found:gen:srv
      =/  maybe-token  (~(get by request-to-token) i.site.req)
      ?~  maybe-token
        not-found:gen:srv
      %-  json-response:gen:srv
      s+u.maybe-token
    ::
    ++  get-file-at
      |=  [base=path file=path ext=@ta]
      ^-  (unit octs)
      ?.  ?=(?(%html %css %js) ext)
        ~
      =/  =path
        :*  (scot %p our.bowl)
            q.byk.bowl
            (scot %da now.bowl)
            (snoc (weld base file) ext)
        ==
      ?.  .^(? %cu path)  ~
      %-  some
      %-  as-octs:mimes:html
      .^(@ %cx path)
    --
  ::
  ++  naive-nmi-action
    |=  =action
    ^-  (quip card _state)
    |^
    ?-    -.action
      %set-api-key       `state(api-key `key.action)
      %set-redirect-url  `state(redirect-url `url.action)
    ::
        %initiate-sale
      ?>  ?=(^ api-key)
      ?>  ?=(^ redirect-url)
      =/  =time  (~(got by request-to-time) request-id.action)
      =/  =wire  /step1/[request-id.action]
      ::  TODO: scry for price of all assets via naive-market
      ::  and scry to make sure sale of these assets is valid
      =/  total-price  ''
      :-  =-  [%pass wire %arvo %i %request -]~
          :_  *outbound-config:iris
          (request-step1 who.action sel.action total-price)
      %_    state
          transactions
        %^  put:orm  transactions  time
        [%pending [who.action sel.action total-price] ~]
      ==
    ::
        %complete-sale
      ?>  ?=(^ api-key)
      ?>  ?=(^ redirect-url)
      =/  =wire  /step3/[token-id.action]
      ::  TODO: one last scry to make sure the price and sale of
      ::  assets is still valid, then proceed
      :_  state
      =-  [%pass wire %arvo %i %request -]~
      [(request-step3 token-id.action) *outbound-config:iris]
    ==
    ::
    ++  request-step1
      |=  [who=ship sel=selector:nam amount=cord]
      ^-  request:http
      ?>  ?=(^ api-key)
      ?>  ?=(^ redirect-url)
      :^  %'POST'  api-url
        ['Content-type' 'text/xml']~
      :-  ~
      %-  xml-to-octs
      ;sale
        ;api-key: "{(trip u.api-key)}"
        ;redirect-url: "{(trip u.redirect-url)}"
        ;amount: "{(trip amount)}"
      ==
      ::%+  parent:xml
      ::  %billing
      :::~  (child:xml %first-name first-name.billing)
      ::    (child:xml %last-name last-name.billing)
      ::    ::(child:xml %address1 address1.billing)
      ::    ::(child:xml %address2 address2.billing)
      ::    ::(child:xml %city city.billing)
      ::    ::(child:xml %state state.billing)
      ::    (child:xml %postal postal.billing)
      ::    ::(child:xml %phone phone.billing)
      ::    (child:xml %email email.billing)
      ::==
    ::
    ++  request-step3
      |=  token=cord
      ^-  request:http
      ?>  ?=(^ api-key)
      :^  %'POST'  api-url
        ['Content-type' 'text/xml']~
      :-  ~
      %-  xml-to-octs
      ;complete-action
        ;api-key: "{(trip u.api-key)}"
        ;token-id: "{(trip token)}"
      ==
    ::
    ++  xml-to-octs
      |=  xml=manx
      ^-  octs
      (as-octt:mimes:html (en-xml:html xml))
    --
  --
::
++  on-arvo
  |=  [=wire =sign-arvo]
  ^-  (quip card:agent:gall _this)
  |^
  ?:  ?=([%eyre %bound *] sign-arvo)
    ~?  !accepted.sign-arvo
      [dap.bowl "bind rejected!" binding.sign-arvo]
    [~ this]
  ?.  ?=(%http-response +<.sign-arvo)
    (on-arvo:def wire sign-arvo)
  =^  cards  state
    (http-response wire client-response.sign-arvo)
  [cards this]
  ::
  ++  http-response
    |=  [=^wire res=client-response:iris]
    ^-  (quip card _state)
    |^
    ?.  ?=(%finished -.res)  `state
    ?+    wire  ~|('unknown request type coming from naive-nmi' !!)
        [%step1 @ ~]
      =/  request-id  i.t.wire
      =/  nd  (normalize-data request-id full-file.res)
      ?.  ?=(%& -.nd)
        +.nd
      `(process-step1 request-id +.nd)
    ::
        [%step3 @ ~]
      =/  request-id  (~(got by token-to-request) i.t.wire)
      =/  nd  (normalize-data request-id full-file.res)
      ?.  ?=(%& -.nd)
        +.nd
      `(process-step3 request-id +.nd)
    ==
    ::
    ++  process-step1
      |=  [request-id=cord tx=transaction m=(map @t @t)]
      ^-  _state
      ?>  ?=(%pending -.tx)
      =/  =time  (~(got by request-to-time) request-id)
      =/  result-code  (~(get by m) 'result-code')
      =/  result-text  (~(get by m) 'result-text')
      =/  form-url     (~(get by m) 'form-url')
      ?.  ?&(?=(^ result-code) ?=(^ result-text))
        %_    state
            transactions
          %^  put:orm  transactions  time
          [%failure info.tx token.tx ~]
        ==
      ?.  =('100' u.result-code)
        %_    state
            transactions
          %^  put:orm  transactions  time
          :^  %failure  info.tx  token.tx
          `[(slav %ud u.result-code) u.result-text]
        ==
      =/  action-token  `@t`(rsh [3 54] (need form-url))
      %_    state
          transactions
        %^  put:orm  transactions  time
        [%pending info.tx `action-token]
      ::
        request-to-token  (~(put by request-to-token) request-id action-token)
        token-to-request  (~(put by token-to-request) action-token request-id)
      ==
    ::
    ++  process-step3
      |=  [request-id=cord tx=transaction m=(map @t @t)]
      ^-  _state
      ?>  ?=(%pending -.tx)
      =/  result-code  (~(get by m) 'result-code')
      =/  result-text  (~(get by m) 'result-text')
      =/  =time  (~(got by request-to-time) request-id)
      %_    state
          transactions
        %^  put:orm  transactions  time
        ?.  ?&(?=(^ result-code) ?=(^ result-text))
          [%failure info.tx token.tx ~]
        ?.  =('100' u.result-code)
          :^  %failure  info.tx  token.tx
          `[(slav %ud u.result-code) u.result-text]
        ~&  %success
        :^  %success  info.tx  token.tx
        ::  TODO: parse result
        *finis
      ::
        request-to-token  (~(del by request-to-token) request-id)
        request-to-time  (~(del by request-to-time) request-id)
        token-to-request  (~(del by token-to-request) (need token.tx))
      ==
    ::
    ++  normalize-data
      |=  [request-id=cord full-file=(unit mime-data:iris)]
      ^-  (each [transaction (map @t @t)] (quip card _state))
      |^
      =/  =time  (~(got by request-to-time) request-id)
      =/  tx=transaction  (got:orm transactions time)
      ?.  ?=(%pending -.tx)
        [%| ~ state]
      ?~  full-file
        :+  %|  ~
        %_    state
            transactions
          %^  put:orm  transactions  time
          [%failure info.tx token.tx ~]
        ==
      =/  xml=(unit manx)
        (de-xml:html `@t`q.data.u.full-file)
      ?~  xml
        :+  %|  ~
        %_    state
            transactions
          %^  put:orm  transactions  time
          [%failure info.tx token.tx ~]
        ==
      [%& [tx (map-from-xml-body u.xml)]]
      ::
      ++  map-from-xml-body
        |=  xml=manx
        ^-  (map @t @t)
        %-  ~(gas by *(map @t @t))
        %+  murn  c.xml
        |=  =manx
        ^-  (unit [@t @t])
        ?.  ?=(@ n.g.manx)  ~
        ?~  c.manx          ~
        ?~  a.g.i.c.manx    ~
        [~ n.g.manx (crip v.i.a.g.i.c.manx)]
      --
    --
  --
::
++  on-watch
  |=  =path
  ^-  (quip card _this)
  ?>  (team:title our.bowl src.bowl)
  ?:  ?=([%http-response *] path)
    `this
  ?:  ?=([%updates ~] path)
    `this
  (on-watch:def path)
::
++  on-peek
  |=  =path
  ^-  (unit (unit cage))
  ?+    path  (on-peek:def path)
    [%x %export ~]  ``noun+!>(state)
  ==
::
++  on-leave  on-leave:def
++  on-agent  on-agent:def
++  on-fail   on-fail:def
--
