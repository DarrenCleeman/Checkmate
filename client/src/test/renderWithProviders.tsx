import { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import { lightTheme } from "@/Utils/Theme/Theme";
import authReducer from "@/Features/Auth/authSlice";
import uiReducer from "@/Features/UI/uiSlice";

interface ExtendedRenderOptions extends Omit<RenderOptions, "wrapper"> {
	preloadedState?: Record<string, unknown>;
	route?: string;
}

export function renderWithProviders(
	ui: ReactElement,
	{
		preloadedState = {},
		route = "/",
		...renderOptions
	}: ExtendedRenderOptions = {}
) {
	const store = configureStore({
		reducer: {
			auth: authReducer,
			ui: uiReducer,
		},
		preloadedState,
	});

	function Wrapper({ children }: { children: React.ReactNode }) {
		return (
			<Provider store={store}>
				<ThemeProvider theme={lightTheme}>
					<MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
				</ThemeProvider>
			</Provider>
		);
	}

	return {
		store,
		...render(ui, { wrapper: Wrapper, ...renderOptions }),
	};
}
