/-  spider, store=graph-store, file-server
/+  strandio
=,  strand=strand:spider
^-  thread:spider
|=  arg=vase
=/  m  (strand:spider ,vase)
=>
|%
+$  font  [name=cord url=cord]
+$  customization
  $:  icon-url=@t
      body-font=font
      accent-font=font
  ==
+$  arg-type
  $:  ~
      =resource:store
      =index:store
      serve-path=path
      customization
  ==
--
|^
^-  form:m
=+  !<(arg-type arg)
;<  =node:store  bind:m  (scry-node resource index)
?>  ?=(%& -.post.node)
=*  post  p.post.node
=/  webpage  (to-webpage post icon-url body-font accent-font)
=/  octt  (to-octt webpage)
;<  ~  bind:m
  %+  raw-poke-our:strandio  %file-server
  :-  %file-server-action
  !>  ^-  action:file-server
  [%unserve-dir serve-path]
;<  ~  bind:m
  %+  poke-our:strandio  %file-server
  :-  %file-server-action
  !>  ^-  action:file-server
  =-  [%serve-glob serve-path - %.y]
  ^-  (map path mime)
  %-  ~(gas by *(map path mime))
  [/index/html [[%text %html ~] octt]]^~
(pure:m !>(~))
::
++  orm      ((on atom node:store) gth)
::
++  scry-node
  |=  [rid=resource:store =index:store]
  =/  m  (strand ,node:store)
  ^-  form:m
  ;<  =update:store  bind:m
    %+  scry:strandio  update:store
    ^-  path
    %-  zing
    :~  /gx/graph-store/graph/(scot %p entity.rid)/[name.rid]/node/index/kith
        (turn index (cury scot %ud))
        /noun
    ==
  ?>  ?=(%add-nodes -.q.update)
  ?>  ?=(^ nodes.q.update)
  (pure:m q.n.nodes.q.update)
::
++  to-octt
  |=  =manx
  %-  as-octt:mimes:html
  %+  welp
    "<!doctype html>"
  %-  en-xml:html
  manx
::
++  html-wrapper
  |=  =marl
  ^-  manx
  ;html
    ;*  marl
  ==
::
++  head-wrapper
  |=  =marl
  ^-  manx
  ;head
    ;*  marl
  ==
::
++  body-wrapper
  |=  =marl
  ^-  manx
  ;body
    ;*  marl
  ==
::
++  to-webpage
  |=  [=post:store icon-url=@t body-font=font accent-font=font]
  ^-  manx
  =/  title=content:store  (snag 0 contents.post)
  ?>  ?=(%text -.title)
  =/  body=content:store  (snag 1 contents.post)
  ?>  ?=(%text -.body)
  ;html
    ;head
      ;meta(charset "utf-8");
      ;meta(name "viewport", content "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0");
      ;link(rel "icon", type "image/png", sizes "32x32", href "{(trip icon-url)}");
      ;link(rel "stylesheet", href "https://unpkg.com/tachyons@4.12.0/css/tachyons.min.css");
      ;link(rel "stylesheet", href "{(trip url.body-font)}");
      ;link(rel "stylesheet", href "{(trip url.accent-font)}");
      ;title: {(trip text.title)} - by {(trip (scot %p author.post))}
    ==
    ;body(class "w-100 h-100 flex flex-column items-center")
      ;+  (header-div post icon-url body-font accent-font)
      ;+  (body-div post icon-url body-font accent-font)
    ==
  ==
++  header-div
  |=  [=post:store icon-url=@t body-font=font accent-font=font]
  ^-  manx
  =/  title=content:store  (snag 0 contents.post)
  ?>  ?=(%text -.title)
  =/  body=content:store  (snag 1 contents.post)
  ?>  ?=(%text -.body)
  ;div(class "w-100 bb b--black-20 flex justify-center")
    ;div(class "flex w-90 pa3 pl4 pr4 justify-between items-center", style "max-width: 44rem;")
      ;span(class "flex items-center")
        ;img(src "{(trip icon-url)}", class "br2", style "width:48px;height:48px;");
        ;p(class "pa2 f5 {(trip name.accent-font)} fw3", style "margin-block-start: 0; margin-block-end: 0;"): Nick Blog
      ==
      ;button(class "f6 pointer fw3 button-reset {(trip name.accent-font)} pa2 bg-black b--none white br2", style "padding: 12px;"): Subscribe
    ==
  ==
::
++  body-div
  |=  [=post:store icon-url=@t body-font=font accent-font=font]
  ^-  manx
  =/  title=content:store  (snag 0 contents.post)
  ?>  ?=(%text -.title)
  =/  body=content:store  (snag 1 contents.post)
  ?>  ?=(%text -.body)
  ;div(class "pa4 flex flex-column w-90 near-black", style "max-width: 44rem;")
    ;h1(class "f2 {(trip name.accent-font)} lh-title", style "margin-block-end: 0;"): {(trip text.title)}
    ;p(class "f5 {(trip name.accent-font)} gray fw3"): {(trip (cut 3 [0 9] (scot %da time-sent.post)))}
    ;p(class "f4 lh-copy fw3 {(trip name.body-font)}", style "white-space: pre-wrap;"): {(trip text.body)}
  ==
::
++  to-webpage-test
  |=  =post:store
  ^-  manx
  ::  ;+  complex expression producing a manx (single element) to marl (list)
  ::      kind of like ~[(some-expression ...)]
  ::  ;/  tape to xml literal
  ::  ;*  complex expression producing a marl
  ::  ;=  form a marl (list), equivalent to :~ in normie hoon
  ::  ;script@"/pay/main.js"; -> '@' sets src attribute on any element
  ::  ; any string -> string literal
  ;html
    ;head
      ;meta(charset "utf-8");
      ;title:'example title'
    ==
    ;body
      ;h2: "example page"
      ; string literal
      ;+  ?:  =(author.post '~bus')
            ;p: 'galaxy'
          ;p: 'not bus'
      ;+  ;/  "asdf"
      ;*  ?:  =(time-sent.post ~2000.1.1)
            ;=  ;p: 'whoa'
                ;h1: 'im old'
              ==
          ;=  ;p: 'whoa it is late'
            ==
    ==
  ==
--

