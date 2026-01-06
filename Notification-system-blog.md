# I’m Rebuilding a Notification System (and Doing It Properly This Time)

A few months ago, I tried to build a notification system.

At that time, it felt fine.
I even thought, “yeah, this design can work”.

Recently, I opened that project again.

And honestly, I couldn’t continue building it.

Not because the code was difficult.
But because I didn’t clearly understand **what the system was supposed to be**.

So I decided to pause, rethink, and redesign it from scratch.

This blog is about how my thinking changed.

---

## What I got wrong the first time

Earlier, my mental model was very simple:

> “When something happens, send a notification.”

Sounds reasonable, right?

But once you start coding with this mindset, everything gets mixed:

* business logic
* notification logic
* real-time delivery
* bundling
* unread counts

I was doing too many things at once, without realizing it.

The system worked in happy cases, but I had no answer for:

* what if delivery fails?
* what if the same event happens twice?
* what if I need to rebuild notifications?

That’s when I knew something was off.

---

## The mental shift that helped

This time, I changed how I look at notifications.

Instead of “sending notifications”, I now think in three steps:

1. Record that something happened
2. Decide who should know about it
3. Decide how to deliver it

Notifications are **not the main thing**.
They are just a view created from events.

This small shift made everything much clearer.

---

## Events come first

Now, whenever something important happens in the system, I record it as an event.

An event simply answers:

> What happened?

That’s all.

Events:

* are never updated
* are never deleted
* don’t care about UI or delivery

If I lose delivery or real-time updates, events still exist.
That gives me confidence.

---

## Notifications are derived from events

Notifications are what users actually see.

They:

* belong to a user
* can be updated
* can be bundled
* have a state like unread or seen

Earlier, I treated bundling as an afterthought.
I tried to merge or delete notifications later.

That was a mistake.

Now, bundling is part of the design itself.

---

## Bundling at the right time

Instead of creating notifications and cleaning them up later, I do this:

* calculate an aggregation key
* check if a notification already exists for that key
* update it if it does
* create a new one if it doesn’t

This keeps the system predictable and simple.

No background cleanup jobs.
No hacks.

---

## Keeping the system boring (on purpose)

I split the system into simple parts.

### Event producer

Business logic only records events.
It doesn’t send notifications or think about delivery.

### Notification processor

This part:

* reads events
* decides receivers
* applies bundling
* writes notifications to the database

No HTTP.
No real-time logic.

### Delivery using SSE

For real-time updates, I’m using Server-Sent Events.

I don’t need two-way communication here.
Notifications mostly flow one way.

If SSE goes down:

* events are still recorded
* notifications are still created
* users see them later

And that’s okay.

---

## Clear notification states

Notifications move through clear states:

* unread
* delivered
* seen

I don’t guess state based on time anymore.
Seen only happens when the user actually opens it.

This removed a lot of confusion.

---

## Thinking about failure helped a lot

This time, I forced myself to ask:

* What if delivery fails?
* What if events are duplicated?
* What if I need to rebuild everything?

With this design, I have answers.

Earlier, I didn’t.

---

## Final thoughts

This version of the system feels:

* slower to build
* slightly heavier
* less “clever”

But it’s much easier to reason about.

My earlier system was complex because it was fragile.
This one is complex only because the problem actually is.

I’m still building this and learning as I go.
But this time, the design makes sense to me.

And that already feels like progress.