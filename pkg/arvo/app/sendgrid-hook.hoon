:: sendgrid-hook [tirrel]
::
::
/-  *sendgrid-hook
/+  default-agent, dbug, verb, server
|%
+$  card  card:agent:gall
+$  state-0
  $:  %0
      api-key=cord
      endpoint=cord
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
    :*  %0
        'SG.test'
        'https://api.sendgrid.com/v3'
    ==
  :-  [%pass /connect %arvo %e %connect [~ /'sendgrid'] dap.bowl]~
  this(state state-0)
::
++  on-save   !>(state)
++  on-load
  |=  old-vase=vase
  ^-  (quip card _this)
  =/  =state-0
    :*  %0
        'SG.test'
        'https://api.sendgrid.com/v3'
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
      %sendgrid-hook-action
    =^  cards  state
      (sendgrid-hook-action !<(action vase))
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
    ^-  [(list card) simple-payload:http]
    =/  req-line=request-line:server
      %-  parse-request-line:server
      url.request.inbound-request
    =*  req-head  header-list.request.inbound-request
    =*  req-body  body.request.inbound-request
    `not-found:gen:server
  ::
  ++  sendgrid-hook-action
    |=  =action
    ^-  (quip card _state)
    |^
    ?+    -.action  !!
        %send-email
      =/  =wire  /send-email/(scot %uv eny.bowl)
      :_  state
      =-  [%pass wire %arvo %i %request -]~
      [(send-email email.action) *outbound-config:iris]
    ==
    ::
    ++  send-email
      |=  =email
      ^-  request:http
      :^  %'POST'  (cat 3 endpoint '/mail/send')
        :~  ['Content-type' 'application/json']
            ['Authorization' (cat 3 'Bearer ' api-key)]
        ==
      :-  ~
      %-  json-to-octs:server
      ^-  json
      %-  pairs:enjs:format
      :~  ['from' (from-to-json from.email)]
          ['subject' s+subject.email]
          ['content' a+(turn content.email content-to-json)]
        ::
          :-  'personalizations'
          a+(turn personalizations.email personalization-to-json)
      ==
    ::
    ++  from-to-json
      |=  from=from-field
      ^-  json
      %-  pairs:enjs:format
      :~  ['email' s+email.from]
          ['name' s+name.from]
      ==
    ::
    ++  content-to-json
      |=  con=content-field
      ^-  json
      %-  pairs:enjs:format
      :~  ['type' s+type.con]
          ['value' s+value.con]
      ==
    ::
    ++  personalization-to-json
      |=  per=personalization-field
      ^-  json
      %+  frond:enjs:format  %to
      a+[(frond:enjs:format %email s+to.per)]~
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
    ~&  res
    ?.  ?=(%finished -.res)  `state
    ?+    wire  ~|('unknown request type coming from sendgrid-hook' !!)
        [%send-email @ ~]
      ~&  res
      ?~  full-file.res
        `state
      ~&  `@t`q.data.u.full-file.res
      [~ state]
    ==
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
