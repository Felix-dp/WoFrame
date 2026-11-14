param([string]$InputPath, [string]$OutputPath)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$studioSpeechType = [Windows.Media.SpeechSynthesis.SpeechSynthesizer,Windows.Media.SpeechSynthesis,ContentType=WindowsRuntime]
$studioStreamType = [Windows.Media.SpeechSynthesis.SpeechSynthesisStream,Windows.Media.SpeechSynthesis,ContentType=WindowsRuntime]
$studioVoice = $studioSpeechType::AllVoices | Where-Object Language -eq 'zh-CN' | Select-Object -First 1
if (-not $studioVoice) { throw 'No zh-CN Windows voice is installed.' }
$studioSynth = New-Object $studioSpeechType.FullName
try {
    $studioSynth.Voice = $studioVoice
    $studioOperation = $studioSynth.SynthesizeTextToStreamAsync([IO.File]::ReadAllText($InputPath))
    $studioAsTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetGenericArguments().Length -eq 1 -and $_.GetParameters().Length -eq 1
    } | Select-Object -First 1
    $studioTask = $studioAsTask.MakeGenericMethod($studioStreamType).Invoke($null, @($studioOperation))
    $studioStream = $studioTask.GetAwaiter().GetResult()
    $studioReadable = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($studioStream.GetInputStreamAt(0))
    $studioFile = [IO.File]::Create($OutputPath)
    try { $studioReadable.CopyTo($studioFile) }
    finally {
        $studioFile.Dispose()
        $studioReadable.Dispose()
    }
} finally {
    $studioSynth.Dispose()
}
