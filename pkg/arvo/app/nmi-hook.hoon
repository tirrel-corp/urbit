:: nmi-hook [tirrel]
::
::
/-  *nmi-hook
/+  default-agent, dbug, verb, server
|%
+$  card  card:agent:gall
::$:  card=*'4111111111111111'
::    expiration=*'10/25'
::    amount=*'1.00'
::    cvv=*'999'
::    zip=*'77777'
::==
+$  error  [result-code=@ud result-text=@ta]
+$  finis
  $:  transaction-id=@ud
      authorization-code=@ud
      cvv-result=@tas
  ==
+$  transaction
  $%  [%success =init-info token=(unit @t) =finis]
      [%failure =init-info token=(unit @t) error=(unit error)]
      [%pending =init-info token=(unit @t)]
  ==
::
+$  token-to-time  (map token=cord time)
+$  transactions   ((mop time transaction) gth)
++  orm            ((on time transaction) gth)
::
+$  state-0
  $:  %0
      api-key=cord
      endpoint=cord
      redirect-url=cord
      =transactions
      =token-to-time
  ==
::  TODO: add rate-limits for POST requests
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
  =/  =state-0
    :*  %0
        '2F822Rw39fx762MaV7Yy86jXGTC7sCDy'
        'https://secure.networkmerchants.com/api/v2/three-step'
        'https://urbit.studio/pay'
        ~
        ~
    ==
  :-  [%pass /connect %arvo %e %connect [~ /'pay'] dap.bowl]~
  this(state state-0)
::
++  on-save   !>(state)
++  on-load
  |=  old-vase=vase
  ^-  (quip card _this)
  =/  =state-0
    :*  %0
        '2F822Rw39fx762MaV7Yy86jXGTC7sCDy'
        'https://secure.networkmerchants.com/api/v2/three-step'
        'https://urbit.studio/pay'
        ~
        ~
    ==
  :-  ~
  this(state state-0)
  ::=/  old  !<(state-0 old-vase)
  ::`this(state old)
::
++  on-poke
  |=  [=mark =vase]
  ^-  (quip card _this)
  ?>  (team:title our.bowl src.bowl)
  |^
  ?+    mark  (on-poke:def mark vase)
      %nmi-hook-action
    =^  cards  state
      (nmi-hook-action !<(action vase))
    [cards this]
  ::
      %handle-http-request
    =+  !<([eyre-id=@ta =inbound-request:eyre] vase)
    =|  sim=simple-payload:http
    =^  cards  sim
      (handle-http-request eyre-id inbound-request)
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
    ++  handle-post-request
      =*  srv  server
      |=  [headers=header-list:http req=request-line:srv bod=(unit octs)]
      ?~  bod
        `[[400 ~] ~]
      ?~  maybe-json=(de-json:html q.u.bod)
        `[[400 ~] ~]
      =/  act=(each action tang)
        (mule |.((dejs u.maybe-json)))
      ?:  ?=(%| -.act)
        `[[400 ~] ~]
      :_  [[201 ~] ~]
      =-  [%pass /post-request/[eyre-id] %agent [our dap]:bowl %poke -]~
      [%nmi-hook-action !>(`action`p.act)]
    ::
    ++  dejs
      =,  dejs:format
      %-  ot
      :~  :-  %action
          %-  of
          :~  [%initiate-payment so]
              [%complete-payment so]
      ==  ==
    ::
    ++  handle-get-request
      =*  srv  server
      |=  [headers=header-list:http request-line:srv]
      ^-  simple-payload:http
      =?  site  ?=([%'pay' *] site)
        t.site
      ?~  ext
        $(ext `%html, site [%index ~])
      =/  file=(unit octs)
        (get-file-at /app/nmi site u.ext)
      ?~  file   not-found:gen:srv
      ?+  u.ext  not-found:gen:srv
        %html  (html-response:gen:srv u.file)
        %js    (js-response:gen:srv u.file)
        %css   (css-response:gen:srv u.file)
      ==
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
  ++  nmi-hook-action
    |=  =action
    ^-  (quip card _state)
    |^
    ?-    -.action
        %initiate-payment
      =/  =wire  /step1/(scot %da now.bowl)
      :-  =-  [%pass wire %arvo %i %request -]~
          [(request-step1 +.action) *outbound-config:iris]
      %_    state
          transactions
        %^  put:orm  transactions  now.bowl
        [%pending +.action ~]
      ==
    ::
        %complete-payment
      =/  =wire  /step3/[token-id.action]
      :_  state
      =-  [%pass wire %arvo %i %request -]~
      [(request-step3 token-id.action) *outbound-config:iris]
    ==
    ::
    ++  request-step1
      |=  init-info
      ^-  request:http
      :^  %'POST'  endpoint
        ['Content-type' 'text/xml']~
      :-  ~
      %-  xml-to-octs
      ^-  manx
      %+  parent:xml
        %sale
      :~  (child:xml %api-key api-key)
          (child:xml %redirect-url redirect-url)
          (child:xml %amount amount)
        ::
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
      ==
    ::
    ++  request-step3
      |=  token=cord
      ^-  request:http
      :^  %'POST'  endpoint
        ['Content-type' 'text/xml']~
      :-  ~
      %-  xml-to-octs
      ^-  manx
      %+  parent:xml
        %complete-action
      :~  (child:xml %api-key api-key)
          (child:xml %token-id token)
      ==
    ::
    ++  xml
      |%
      ++  parent
        |=  [tag=term children=marl]
        ^-  manx
        :-  [tag ~]
        children
      ::
      ++  child
        |=  [tag=term body=cord]
        ^-  manx
        :+  [tag ~]
          [[%$ [%$ (trip body)] ~] ~]
        ~
      --
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
    ?+    wire  ~|('unknown request type coming from nmi-hook' !!)
        [%step1 @ ~]
      =/  =time  (slav %da i.t.wire)
      =/  nd  (normalize-data time full-file.res)
      ?.  ?=(%& -.nd)
        +.nd
      (process-step1 time +.nd)
    ::
        [%step3 @ ~]
      =/  =time  (~(got by token-to-time) i.t.wire)
      =/  nd  (normalize-data time full-file.res)
      ?:  ?=(%& -.nd)
        (process-step3 time +.nd)
      +.nd
    ==
    ::
    ++  process-step1
      |=  [=time tx=transaction m=(map @t @t)]
      ^-  (quip card _state)
      :-  ~
      ?>  ?=(%pending -.tx)
      =/  result-code  (~(get by m) 'result-code')
      =/  result-text  (~(get by m) 'result-text')
      =/  form-url     (~(get by m) 'form-url')
      ?.  ?&(?=(^ result-code) ?=(^ result-text))
        %_    state
            transactions
          %^  put:orm  transactions  time
          [%failure init-info.tx token.tx ~]
        ==
      ?.  =('100' u.result-code)
        %_    state
            transactions
          %^  put:orm  transactions  time
          :^  %failure  init-info.tx  token.tx
          `[(slav %ud u.result-code) u.result-text]
        ==
      ~&  result+[u.result-code u.result-text `@t`(rsh [3 54] (need form-url))]
      =/  action-token  `@t`(rsh [3 54] (need form-url))
      ~&  url+`@t`(rap 3 'https://urbit.studio/pay/step2.html?action=' action-token ~)
      %_    state
          transactions
        %^  put:orm  transactions  time
        [%pending init-info.tx `action-token]
      ::
        token-to-time  (~(put by token-to-time) action-token time)
      ==
    ::
    ++  process-step3
      |=  [=time tx=transaction m=(map @t @t)]
      ^-  (quip card _state)
      :-  ~
      ?>  ?=(%pending -.tx)
      =/  result-code  (~(get by m) 'result-code')
      =/  result-text  (~(get by m) 'result-text')
      %_    state
          transactions
        %^  put:orm  transactions  time
        ?.  ?&(?=(^ result-code) ?=(^ result-text))
          [%failure init-info.tx token.tx ~]
        ?.  =('100' u.result-code)
          :^  %failure  init-info.tx  token.tx
          `[(slav %ud u.result-code) u.result-text]
        :^  %success  init-info.tx  token.tx
        ::  TODO: parse result
        *finis
      ==
    ::
    ++  normalize-data
      |=  [=time full-file=(unit mime-data:iris)]
      ^-  (each [transaction (map @t @t)] (quip card _state))
      |^
      =/  tx=transaction  (got:orm transactions time)
      ?>  ?=(%pending -.tx)
      ?~  full-file
        :+  %|  ~
        %_    state
            transactions
          %^  put:orm  transactions  time
          [%failure init-info.tx token.tx ~]
        ==
      =/  xml=(unit manx)
        (de-xml:html `@t`q.data.u.full-file)
      ?~  xml
        :+  %|  ~
        %_    state
            transactions
          %^  put:orm  transactions  time
          [%failure init-info.tx token.tx ~]
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
