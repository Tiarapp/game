<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Arcade Hub</title>
    <link rel="stylesheet" href="{{ asset('vendor/bootstrap.min.css') }}">
    <link rel="stylesheet" href="{{ asset('css/game.css') }}">
</head>
<body style="overflow:auto">
<div class="screen active" style="min-height:100%;height:auto">
    <div class="container menu-wrap text-center">
        <h1 class="logo">ARCADE <span>HUB</span></h1>
        <p class="tagline">Pilih game yang ingin dimainkan</p>
        <div class="hub-grid">
            @foreach ($games as $g)
                @php $tag = $g['url'] ? 'a' : 'div'; @endphp
                <{{ $tag }} class="gcard {{ $g['url'] ? '' : 'soon' }}" style="--c:{{ $g['color'] }}" @if($g['url']) href="{{ $g['url'] }}" @endif>
                    <div class="gicon">{{ $g['icon'] }}</div>
                    <div class="gtitle">{{ $g['title'] }}</div>
                    <div class="gdesc">{{ $g['desc'] }}</div>
                    <span class="gbadge">{{ $g['players'] }}</span>
                </{{ $tag }}>
            @endforeach
        </div>
    </div>
</div>
</body>
</html>
