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
+$  state-0
  $:  %0
      api-key=cord
      endpoint=cord
      redirect-url=cord
  ==
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
    :^  %0  '2F822Rw39fx762MaV7Yy86jXGTC7sCDy'
      'https://secure.networkmerchants.com/api/v2/three-step'
    'https://urbit.studio/pay'
  :-  [%pass /connect %arvo %e %connect [~ /'pay'] dap.bowl]~
  this(state state-0)
::
++  on-save   !>(state)
++  on-load
  |=  old-vase=vase
  ^-  (quip card _this)
  =/  =state-0
    :^  %0  '2F822Rw39fx762MaV7Yy86jXGTC7sCDy'
      'https://secure.networkmerchants.com/api/v2/three-step'
    'https://urbit.studio/pay/step3.html'
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
      %nmi-hook-update
    =^  cards  state
      (nmi-hook-update !<(update vase))
    [cards this]
  ::
      %handle-http-request
    =+  !<([eyre-id=@ta =inbound-request:eyre] vase)
    :_  this
    %+  give-simple-payload:app:server  eyre-id
    (handle-http-request inbound-request)
  ==
  ::
  ++  handle-http-request
    =,  server
    |=  =inbound-request:eyre
    |^
    ^-  simple-payload:http
    =/  req-line=request-line
      %-  parse-request-line
      url.request.inbound-request
    =*  req-head  header-list.request.inbound-request
    ?.  ?=(%'GET' method.request.inbound-request)
      not-found:gen
    (handle-get-request req-head req-line)
    ::
    ++  handle-get-request
      =,  server
      |=  [headers=header-list:http request-line]
      ^-  simple-payload:http
      =?  site  ?=([%'pay' *] site)
        t.site
      ?~  ext
        $(ext `%html, site [%index ~])
      =/  file=(unit octs)
        (get-file-at /app/nmi site u.ext)
      ?~  file   not-found:gen
      ?+  u.ext  not-found:gen
        %html  (html-response:gen u.file)
        %js    (js-response:gen u.file)
        %css   (css-response:gen u.file)
        %png   (png-response:gen u.file)
      ==
    ::
    ++  get-file-at
      |=  [base=path file=path ext=@ta]
      ^-  (unit octs)
      ?.  ?=(?(%html %css %js %png) ext)
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
  ++  nmi-hook-update
    |=  =update
    ^-  (quip card _state)
    ?+    -.update  !!
        %initiate-payment
      =/  req  (request-step1 +.update)
      =/  out  *outbound-config:iris
      :_  state
      [%pass /step1/[(scot %da now.bowl)] %arvo %i %request req out]~
    ==
  ::
  ++  request-step1
    |=  init-info
    ^-  request:http
    :^  %'POST'  endpoint
      :~  ['Content-type' 'text/xml']
      ==
    :-  ~
    %-  xml-to-octs
    ^-  manx
    %+  parent:xml
      %sale
    :~  (child:xml %api-key api-key)
        (child:xml %redirect-url redirect-url)
        (child:xml %amount amount)
      ::
        %+  parent:xml
          %billing
        :~  (child:xml %first-name first-name.billing)
            (child:xml %last-name last-name.billing)
            (child:xml %address1 address1.billing)
            (child:xml %address2 address2.billing)
            (child:xml %city city.billing)
            (child:xml %state state.billing)
            (child:xml %postal postal.billing)
            (child:xml %phone phone.billing)
            (child:xml %email email.billing)
        ==
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
    ~&  [%xml (en-xml:html xml)]
    (as-octt:mimes:html (en-xml:html xml))
  --
::
++  on-watch
  |=  =path
  ^-  (quip card _this)
  ?>  (team:title our.bowl src.bowl)
  ?:  ?=([%http-response *] path)
    [~ this]
  ?:  ?=([%updates ~] path)
    `this
  (on-watch:def path)
::
++  on-leave  on-leave:def
++  on-peek
  |=  =path
  ^-  (unit (unit cage))
  ?+    path  (on-peek:def path)
    [%x %export ~]  ``noun+!>(state)
  ==
::
++  on-agent  on-agent:def
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
    |=  [=^wire response=client-response:iris]
    ^-  (quip card _state)
    ::  ignore all but %finished
    ?.  ?=(%finished -.response)
      [~ state]
    =/  data=(unit mime-data:iris)  full-file.response
    ?~  data
      :: data is null
      [~ state]
    ~&  [%http-response `@t`q.data.u.data]
    [~ state]
  --
::
++  on-fail   on-fail:def
--
