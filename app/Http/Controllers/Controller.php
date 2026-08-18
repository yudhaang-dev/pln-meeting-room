<?php

namespace App\Http\Controllers;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

abstract class Controller extends BaseController
{
    use AuthorizesRequests;

    /**
     * Execute an action within a try-catch block and flash a toast on failure.
     */
    protected function catchErrors(callable $action, string $fallbackMessage = 'Terjadi kesalahan yang tidak terduga.'): RedirectResponse|Response
    {
        try {
            return $action();
        } catch (AuthorizationException $e) {
            throw $e;
        } catch (ValidationException $e) {
            throw $e;
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            Inertia::flash('toast', ['type' => 'error', 'message' => $fallbackMessage]);

            return back();
        }
    }

    /**
     * Execute a JSON-returning action within a try-catch block.
     */
    protected function catchErrorsJson(callable $action, string $fallbackMessage = 'Terjadi kesalahan yang tidak terduga.'): JsonResponse
    {
        try {
            return $action();
        } catch (AuthorizationException $e) {
            throw $e;
        } catch (ValidationException $e) {
            throw $e;
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => $fallbackMessage], 500);
        }
    }
}
