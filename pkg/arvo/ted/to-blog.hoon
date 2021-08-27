/-  spider, store=graph-store, file-server
/+  strandio
=,  strand=strand:spider
^-  thread:spider
|=  arg=vase
=/  m  (strand:spider ,vase)
|^
^-  form:m
=+  !<([~ =resource:store =index:store serve-path=path] arg)
;<  =graph:store  bind:m  (scry-graph resource)
?~  index
  !!
=/  =node:store  (got:orm graph i.index)
?.  ?=(%graph -.children.node)
  !!
=/  first-note  (got:orm p.children.node 1)
?.  ?=(%graph -.children.first-note)
  !!
=/  first-revision  (got:orm p.children.first-note 1)
?:  ?=(%| -.post.first-revision)
  !!
=*  post  p.post.first-revision
=/  webpage  (to-webpage post)
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
++  scry-graph
  |=  rid=resource:store
  =/  m  (strand ,graph:store)
  ^-  form:m
  ;<  =update:store  bind:m
    %+  scry:strandio  update:store
    /gx/graph-store/graph/(scot %p entity.rid)/[name.rid]/noun
  ?>  ?=(%add-graph -.q.update)
  (pure:m graph.q.update)
::
++  to-octt
  |=  =manx
  %-  as-octt:mimes:html
  %+  welp
    "<!doctype html>"
  %-  en-xml:html
  manx
::
++  to-webpage
  |=  =post:store
  ^-  manx
  =/  title=content:store  (snag 0 contents.post)
  ?>  ?=(%text -.title)
  =/  body=content:store  (snag 1 contents.post)
  ?>  ?=(%text -.body)
  ;html
    ;head
      ;meta(charset "utf-8");
      ;meta(name "viewport", content "width=device-width, initial-scale=1.0");
      ;link(rel "stylesheet", href "https://unpkg.com/tachyons@4.12.0/css/tachyons.min.css");
      ;link(rel "stylesheet", href "https://pagecdn.io/lib/easyfonts/spectral.css");
      ;title: {(trip text.title)} - {(trip (scot %p author.post))}
    ==
    ;body(class "w-100 h-100 pa4 flex justify-center")
      ;div(class "flex flex-column w-90 near-black", style "max-width: 44rem;")
        ;h1(class "f2 sans-serif lh-title"): {(trip text.title)}
        ;p(class "f4 font-spectral lh-copy fw3", style "white-space: pre-wrap;"): {(trip text.body)}
      ==
    ==
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

