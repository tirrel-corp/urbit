/-  *pipe, store=graph-store
|_  site=website
++  grow
  |%
  ++  noun  site
  ++  pipe-website
    |=  =update:store
    ^-  website
    |^
    ?>  ?=(%add-nodes -.q.update)
    (nodes-to-website nodes.q.update)
    ::
    ++  orm      ((on atom node:store) gth)
    ::
    ++  nodes-to-website
      |=  =(map index node:store)
      ^-  website
      %-  ~(gas by *website)
      %+  weld
        %+  turn  ~(tap by map)
        node-to-article-page
      (map-to-index-page map)^~
    ::
    ++  strip-title
      |=  title=cord
      `@ta`(crip (en-urlt:html (trip (wood (crip (cass (trip title)))))))
    ::
    ++  title-to-url
      |=  title=cord
      ^-  path
      :+  (strip-title title)
        %html
      ~
    ::
    ++  map-to-index-page
      |=  =(map index node:store)
      ^-  [path mime]
      :-  /index/html
      :-  [%text %html ~]
      %-  as-octt:mimes:html
      %+  welp
        "<!doctype html>"
      %-  en-xml:html
      ;html
        ;head
          ;meta(charset "utf-8");
          ;meta(name "viewport", content "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0");
          ;link(rel "stylesheet", href "https://unpkg.com/tachyons@4.12.0/css/tachyons.min.css");
        ==
        ;body(class "w-100 h-100 flex flex-column items-center")
          ;div(class "pa4 flex flex-column w-90 near-black", style "max-width: 44rem;")
            ;*  (turn ~(tap by map) node-to-article-preview)
          ==
        ==
      ==
    ::
    ++  node-to-article-preview
      |=  [=index =node:store]
      ^-  manx
      =/  accent-font=(pair tape tape)
        ["" "sans-serif"]
      ?>  ?=(%graph -.children.node)
      =/  article-revision-container=node:store  (got:orm p.children.node 1)
      ?>  ?=(%graph -.children.article-revision-container)
      =/  latest-revision=(unit [@ node:store])
        (pry:orm p.children.article-revision-container)
      ?~  latest-revision
        !!
      ?>  ?=(%& -.post.+.u.latest-revision)
      =*  post  p.post.+.u.latest-revision
      =/  title=content:store  (snag 0 contents.post)
      ?>  ?=(%text -.title)
      ;a(class "link pa3 pt4 pb4 br2 ba b--dark-gray mb4", style "display: block;", href "./{(trip (strip-title text.title))}.html")
        ;h1(class "f2 black lh-title {q.accent-font}", style "margin-block-start: 0; margin-block-end: 0;"): {(trip text.title)}
        ;p(class "f5 gray fw3 {q.accent-font}", style "margin-block-end: 0;"): {(trip (scot %da time-sent.post))}
      ==
    ::
    ++  node-to-article-page
      |=  [=index =node:store]
      ^-  [path mime]
      ~&  index
      ?>  ?=(%graph -.children.node)
      =/  article-revision-container=node:store  (got:orm p.children.node 1)
      ?>  ?=(%graph -.children.article-revision-container)
      =/  latest-revision=(unit [@ node:store])
        (pry:orm p.children.article-revision-container)
      ?~  latest-revision
        !!
      ?>  ?=(%& -.post.+.u.latest-revision)
      =*  post  p.post.+.u.latest-revision
      =/  title=content:store  (snag 0 contents.post)
      ?>  ?=(%text -.title)
      :-  (title-to-url text.title)
      :-  [%text %html ~]
      %-  as-octt:mimes:html
      %+  welp
        "<!doctype html>"
      (en-xml:html (to-blog post))
    ::
    ++  to-blog
      |=  =post:store
      ^-  manx
      =/  body-font=(pair tape tape)
        ["https://pagecdn.io/lib/easyfonts/spectral.css" "font-spectral"]
      =/  accent-font=(pair tape tape)
        ["" "sans-serif"]
      =/  title=content:store  (snag 0 contents.post)
      ?>  ?=(%text -.title)
      =/  body=content:store  (snag 1 contents.post)
      ?>  ?=(%text -.body)
      ;html
        ;head
          ;meta(charset "utf-8");
          ;meta(name "viewport", content "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0");
          ;link(rel "stylesheet", href "https://unpkg.com/tachyons@4.12.0/css/tachyons.min.css");
          ;link(rel "stylesheet", href "{p.body-font}");
          ;link(rel "stylesheet", href "{p.accent-font}");
          ;title: {(trip text.title)} - by {(trip (scot %p author.post))}
        ==
        ;body(class "w-100 h-100 flex flex-column items-center")
          ;a(class "pt4 pl4 w-90 link gray {q.accent-font}", style "max-width: 44rem;", href "./"): Home
          ;div(class "pa4 pt3 flex flex-column w-90 near-black", style "max-width: 44rem;")
            ;h1(class "f2 lh-title {q.accent-font}", style "margin-block-end: 0;"): {(trip text.title)}
            ;p(class "f5 gray {q.accent-font} fw3"): {(trip (scot %da time-sent.post))}
            ;p(class "f4 lh-copy {q.body-font} fw3", style "white-space: pre-wrap;"): {(trip text.body)}
          ==
        ==
      ==
    --
  --
::
++  grab
  |%
  ++  noun  website
  --
::
++  grad  %noun
--
