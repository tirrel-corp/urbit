:: mailer [tirrel]
::
::
/-  *mailer, pipe
/+  default-agent, dbug, verb, server
|%
+$  card  card:agent:gall
+$  blog
  $:  =mailing-list
      =website:pipe
  ==
+$  state-0
  $:  %0
      creds=(unit [api-key=@t email=@t ship-url=@t])
      blogs=(map term blog)
  ==
+$  versioned-state
  $%  state-0
  ==
--
::
=|  state-0
=*  state  -
::
%-  agent:dbug
%+  verb  |
^-  agent:gall
=<
|_  =bowl:gall
+*  this  .
    def   ~(. (default-agent this %|) bowl)
    do    ~(. +> bowl)
::
++  on-init
  :_  this
  [%pass /connect %arvo %e %connect [~ /'mailer'] dap.bowl]~
::
++  on-save   !>(state)
++  on-load
  |=  old-vase=vase
  ^-  (quip card _this)
::  `this(state *state-0)
  =+  !<(old=versioned-state old-vase)
  ?-  -.old
    %0  `this(state [%0 +.old])
  ==
::
++  on-poke
  |=  [=mark =vase]
  ^-  (quip card _this)
  ?>  (team:title our.bowl src.bowl)
  |^
  ?+    mark  (on-poke:def mark vase)
      %mailer-action
    ~&  q.vase
    =^  cards  state
      (mailer-action !<(action vase))
    [cards this]
  ::
      %handle-http-request
    =+  !<([eyre-id=@ta =inbound-request:eyre] vase)
    =^  sim  state
      (handle-http-request eyre-id inbound-request)
    :_  this
    (give-simple-payload:app:server eyre-id sim)
  ==
  ::
  ++  handle-http-request
    |=  [eyre-id=@ta =inbound-request:eyre]
    ^-  [simple-payload:http _state]
    =/  req-line=request-line:server
      %-  parse-request-line:server
      url.request.inbound-request
    =*  req-head  header-list.request.inbound-request
    =*  req-body  body.request.inbound-request
    ~&  req-line
    ?+  site.req-line
      :_  state
      not-found:gen:server
    ::
        [%mailer %unsubscribe @ ~]
      ?~  ext.req-line
        :_  state
        not-found:gen:server
      =/  del-token=@uv
        (slav %uv (rap 3 i.t.t.site.req-line '.' u.ext.req-line ~))
      =.  blogs
        %-  ~(rep by blogs)
        |=  [[=term =blog] bs=_blogs]
        =.  mailing-list.blog
          %-  ~(rep by mailing-list.blog)
          |=  [[addr=@t token=@uv] ml=_mailing-list.blog]
          ^-  mailing-list
          ?.  =(token del-token)
            ml
          (~(del by ml) addr)
        (~(put by bs) term blog)
      =/  res=manx
        ;div: Unsubscribed successfully
      :_  state
      (manx-response:gen:server res)
    ==
  ::
  ++  mailer-action
    |=  act=action
    ^-  (quip card _state)
    ?-    -.act
        %send-email
      =/  =wire  /send-email/(scot %uv eny.bowl)
      :_  state
      =-  [%pass wire %arvo %i %request -]~
      [(send-email email.act) *outbound-config:iris]
    ::
        %set-creds
      :-  ~
      %=  state
        creds  `[api-key.act email.act ship-url.act]
      ==
    ::
        %add-blog
      ?:  (~(has by blogs) name.act)
        ~|("blog already exists: {<name.act>}" !!)
      =/  recipients=mailing-list
        %-  ~(run in mailing-list.act)
        |=  email=@t
        [email (sham email eny.bowl)]
      :_  state(blogs (~(put by blogs) name.act recipients ~))
      [%pass /pipe/[name.act] %agent [our.bowl %pipe] %watch /email/[name.act]]~
    ::
        %del-blog
      ?.  (~(has by blogs) name.act)
        ~|("no such blog: {<name.act>}" !!)
      :_  state(blogs (~(del by blogs) name.act))
      [%pass /pipe/[name.act] %agent [our.bowl %pipe] %leave ~]~
    ::
        %add-recipients
      =/  old  (~(get by blogs) name.act)
      ?~  old  ~|("no such blog: {<name.act>}" !!)
      =/  recipients=mailing-list
        %-  ~(run in mailing-list.act)
        |=  email=@t
        [email (sham email eny.bowl)]
      =/  new=mailing-list  (~(uni by mailing-list.u.old) recipients)
      `state(blogs (~(put by blogs) name.act new website.u.old))
    ::
        %del-recipients
      =/  old  (~(get by blogs) name.act)
      ?~  old  ~|("no such blog: {<name.act>}" !!)
      =/  recipients=mailing-list
        %-  ~(run in mailing-list.act)
        |=  email=@t
        [email *@uv]
      =/  new=mailing-list  (~(dif by mailing-list.u.old) recipients)
      `state(blogs (~(put by blogs) name.act new website.u.old))
    ==
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
    ?+    wire  ~|('unknown request type coming from mailer' !!)
        [%send-email @ ~]
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
      [%x %export ~]
    ``noun+!>(state)
  ::
      [%x %creds ~]
    :^  ~  ~  %json  !>
    ?~  creds  ~
    %-  pairs:enjs:format
    :~  api-key+s+api-key.u.creds
        email+s+email.u.creds
        ship-url+s+ship-url.u.creds
    ==
  ::
      [%x %mailing-lists ~]
    :^  ~  ~  %json  !>
    :-  %o
    ^-  (map @t json)
    %-  ~(run by blogs)
    |=  =blog
    ^-  json
    :-  %a
    %+  turn  ~(tap by mailing-list.blog)
    |=  [e=@t @uv]
    [%s e]
  ==
::
++  on-agent
  |=  [=wire =sign:agent:gall]
  ^-  (quip card _this)
  ?+  -.sign  (on-agent:def wire sign)
      %kick
    ?>  ?=([%pipe @ ~] wire)
    =*  name  i.t.wire
    :_  this
    [%pass /pipe/[name] %agent [our.bowl %pipe] %watch /email/[name]]~
  ::
      %fact
    ?>  ?=([%pipe @ ~] wire)
    ?>  ?=(%pipe-update p.cage.sign)
    ?~  creds
      ~|("No Sendgrid credentials set up" !!)
    =*  name  i.t.wire
    =+  !<(=update:pipe q.cage.sign)
    ~&  update
    =/  old  (~(got by blogs) name)
    =/  content=(list [@t @t])
      =+  a=(snag 0 ~(val by website.update))
      [[(rsh [3 1] (spat p.a)) q.q.a] ~]
    =/  person=(list personalization-field)
      %+  turn  ~(tap by mailing-list.old)
      |=  [address=@t token=@uv]
      :*  [address]~
          %+  my
            :-  'List-Unsubscribe'
            (rap 3 '<http://novlud-padtyv.arvo.network/mailer/unsubscribe/' (scot %uv token) '>' ~)
          ~
      ==
    =/  =email
      :*  [email.u.creds (scot %p our.bowl)]
          'new subject'
          content
          person
      ==
    :_  this
    =-  [%pass /send-email/(scot %uv eny.bowl) %arvo %i %request -]~
    [(send-email email) *outbound-config:iris]
  ==
::
++  on-leave  on-leave:def
++  on-fail   on-fail:def
--
|_  =bowl:gall
++  send-email
  |=  =email
  ^-  request:http
  ?>  ?=(^ creds)
  :^  %'POST'  'https://api.sendgrid.com/v3/mail/send'
    :~  ['Content-type' 'application/json']
        ['Authorization' (cat 3 'Bearer ' api-key.u.creds)]
    ==
  :-  ~
  %-  json-to-octs:server
  =-  ~&  -  -
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
  %-  pairs:enjs:format
  :~  to+(to-to-json to.per)
      headers+(headers-to-json headers.per)
  ==
::
++  to-to-json
  |=  to=(list cord)
  ^-  json
  :-  %a
  %+  turn  to
  |=  recipient=@t
  ^-  json
  (frond:enjs:format %email s+recipient)
::
++  headers-to-json
  |=  headers=(map cord cord)
  ^-  json
  :-  %o
  %-  ~(gas by *(map @t json))
  %+  turn  ~(tap by headers)
  |=  [a=@t b=@t]
  [a s+b]
--
