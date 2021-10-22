/-  *pipe, store=graph-store
/+  cram, *pipe-render
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
      %-  ~(rep by map)
      |=  [[=index =node:store] out=website]
      ?.  -.post.node
        out
      ?>  ?=(%.y -.post.node)
      ?~  contents.p.post.node
        out
      %-  ~(gas by *website)
      [(post-to-email index p.post.node) ~]
    ::
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
